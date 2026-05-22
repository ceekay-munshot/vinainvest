#!/usr/bin/env node
// Screener.in screen scraper.
// 1. Logs in with SCREENER_EMAIL / SCREENER_PASSWORD.
// 2. Reads the live company list from the saved screen (all pages).
// 3. Visits each company page and extracts the top ratio ribbon.
// 4. Writes screener-companies.csv + .json to ./output/.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "output");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ORIGIN = "https://www.screener.in";

const EMAIL = process.env.SCREENER_EMAIL;
const PASSWORD = process.env.SCREENER_PASSWORD;
const FALLBACK_SESSIONID = process.env.SCREENER_SESSIONID;
const screenUrl = process.env.SCREEN_URL || "https://www.screener.in/screens/3675531/fundareal-klp-final/";
const maxPages = Number(process.env.MAX_PAGES || "30");
const maxCompanies = Number(process.env.MAX_COMPANIES || "0"); // 0 = all

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });

  let cookie;
  if (EMAIL && PASSWORD) {
    console.log("Logging in to Screener...");
    cookie = await login(EMAIL, PASSWORD);
    console.log("Login OK.\n");
  } else if (FALLBACK_SESSIONID) {
    cookie = `sessionid=${FALLBACK_SESSIONID}`;
  } else {
    throw new Error("Set SCREENER_EMAIL + SCREENER_PASSWORD in repo secrets.");
  }

  const base = screenUrl.split("?")[0].replace(/\/+$/, "");
  const companies = await fetchScreenCompanies(base, cookie);
  console.log(`\nScreen returned ${companies.length} companies.`);
  if (!companies.length) throw new Error("Screen returned no companies — login or screen URL may be wrong.");

  const limit = maxCompanies > 0 ? Math.min(maxCompanies, companies.length) : companies.length;
  console.log(`Scraping ${limit} company pages...\n`);

  const rows = [];
  const allKeys = new Set(["Company", "Screener URL"]);
  let failures = 0;

  for (let i = 0; i < limit; i++) {
    const c = companies[i];
    process.stdout.write(`[${i + 1}/${limit}] ${c.name} ... `);
    try {
      const ratios = await fetchCompanyRatios(c.path, cookie);
      const row = { Company: c.name, "Screener URL": `${ORIGIN}${c.path}`, ...ratios };
      Object.keys(ratios).forEach((k) => allKeys.add(k));
      rows.push(row);
      console.log(`${Object.keys(ratios).length} ratios`);
    } catch (err) {
      failures++;
      rows.push({ Company: c.name, "Screener URL": `${ORIGIN}${c.path}`, Error: err.message });
      console.log(`FAILED: ${err.message}`);
    }
    await sleep(600);
  }

  const headers = [...allKeys];
  const csv = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))]
    .map((line) => line.map(csvCell).join(","))
    .join("\n");
  writeFileSync(resolve(OUT_DIR, "screener-companies.csv"), csv + "\n");
  writeFileSync(resolve(OUT_DIR, "screener-companies.json"), JSON.stringify(rows, null, 2) + "\n");

  console.log("\n=== Done ===");
  console.log(`Companies scraped: ${rows.length} (${failures} failed)`);
  console.log(`Ratio columns found: ${headers.length - 2}`);
  console.log(`Columns: ${headers.join(" | ")}`);
  console.log("\nFiles in screener-test/output/ — download from the workflow artifact.");
}

async function login(email, password) {
  const loginUrl = `${ORIGIN}/login/`;
  const getRes = await fetch(loginUrl, { headers: { "User-Agent": UA } });
  if (!getRes.ok) throw new Error(`Login page returned HTTP ${getRes.status}.`);
  const csrftoken = extractCookie(getRes.headers.getSetCookie(), "csrftoken");
  const html = await getRes.text();
  const tokenMatch = html.match(/name="csrfmiddlewaretoken"\s+value="([^"]+)"/);
  if (!tokenMatch || !csrftoken) throw new Error("Could not read CSRF token from login page.");

  const body = new URLSearchParams({
    csrfmiddlewaretoken: tokenMatch[1],
    username: email,
    password,
    next: "/"
  });
  const postRes = await fetch(loginUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `csrftoken=${csrftoken}`,
      Referer: loginUrl
    },
    body: body.toString()
  });

  const sessionid = extractCookie(postRes.headers.getSetCookie(), "sessionid");
  if (!sessionid) throw new Error("Login failed — check SCREENER_EMAIL / SCREENER_PASSWORD.");
  const newCsrf = extractCookie(postRes.headers.getSetCookie(), "csrftoken") || csrftoken;
  return `sessionid=${sessionid}; csrftoken=${newCsrf}`;
}

async function fetchScreenCompanies(base, cookie) {
  const companies = [];
  const seen = new Set();
  let totalPages = 1;

  for (let page = 1; page <= maxPages; page++) {
    process.stdout.write(`Reading screen page ${page} ... `);
    const res = await fetch(`${base}/?page=${page}`, {
      headers: { Cookie: cookie, "User-Agent": UA }
    });
    if (!res.ok) {
      console.log(`HTTP ${res.status}`);
      if (page === 1) throw new Error(`Screen page 1 returned HTTP ${res.status}.`);
      break;
    }
    const $ = cheerio.load(await res.text());
    const table = $("table.data-table").first();
    if (!table.length) {
      console.log("no table");
      if (page === 1) throw new Error("No data table on screen page 1.");
      break;
    }

    let added = 0;
    table.find("tbody tr").each((_, tr) => {
      const link = $(tr).find("td a[href^='/company/']").first();
      const href = link.attr("href");
      if (href && !seen.has(href)) {
        seen.add(href);
        companies.push({ name: link.text().trim().replace(/\s+/g, " "), path: href });
        added++;
      }
    });

    const m = $("body").text().match(/page\s+\d+\s+of\s+(\d+)/i);
    if (m) totalPages = Number(m[1]);
    console.log(`${added} companies (page ${page} of ${totalPages})`);

    if (page >= totalPages) break;
    await sleep(600);
  }
  return companies;
}

async function fetchCompanyRatios(path, cookie) {
  const res = await fetch(`${ORIGIN}${path}`, {
    headers: { Cookie: cookie, "User-Agent": UA }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const data = {};

  // 1. Top ratio ribbon
  $("#top-ratios li").each((_, li) => {
    const name = $(li).find(".name").text().trim().replace(/\s+/g, " ");
    const value = $(li).find(".value").text().trim().replace(/\s+/g, " ");
    if (name) data[name] = cleanValue(value);
  });
  if (!Object.keys(data).length) {
    throw new Error("no #top-ratios block found");
  }

  // 2. Quarterly Results -> Net Profit, last 4 quarters
  const npq = parseSectionRow($, "#quarters", /^net profit/i);
  if (npq && npq.values.length) {
    const last4 = npq.values.slice(-4);
    const labels = npq.headers.slice(-4);
    data["Net Profit Qtr (latest)"] = last4[3] ?? "";
    data["Net Profit Qtr (-1)"] = last4[2] ?? "";
    data["Net Profit Qtr (-2)"] = last4[1] ?? "";
    data["Net Profit Qtr (-3)"] = last4[0] ?? "";
    data["_npq_quarters"] = labels.join(" | ");
  }

  // 3. Cash Flow -> Cash from Operating Activity, last + preceding year
  const cf = parseSectionRow($, "#cash-flow", /cash from operating/i);
  if (cf && cf.values.length) {
    const yearly = cf.headers
      .map((h, i) => ({ h, v: cf.values[i] }))
      .filter((p) => p.v !== undefined && !/ttm/i.test(p.h))
      .map((p) => p.v);
    data["CF Operations LY"] = yearly[yearly.length - 1] ?? "";
    data["CF Operations PY"] = yearly[yearly.length - 2] ?? "";
  }

  // 4. Profit & Loss -> OPM %, 5-year average
  const opm = parseSectionRow($, "#profit-loss", /^opm\s*%/i);
  if (opm && opm.values.length) {
    const nums = opm.headers
      .map((h, i) => ({ h, v: opm.values[i] }))
      .filter((p) => p.v !== undefined && !/ttm/i.test(p.h))
      .map((p) => parseFloat(String(p.v).replace(/[^0-9.\-]/g, "")))
      .filter((n) => Number.isFinite(n));
    const last5 = nums.slice(-5);
    data["OPM 5Year %"] = last5.length
      ? (last5.reduce((a, b) => a + b, 0) / last5.length).toFixed(2)
      : "";
  }

  return data;
}

function parseSectionRow($, sectionSel, labelRegex) {
  const table = $(`${sectionSel} table`).first();
  if (!table.length) return null;
  const headers = [];
  table.find("thead th").each((_, th) => headers.push($(th).text().trim().replace(/\s+/g, " ")));
  let result = null;
  table.find("tbody tr").each((_, tr) => {
    if (result) return;
    const cells = $(tr).find("td");
    const label = $(cells[0]).text().trim().replace(/\s+/g, " ");
    if (labelRegex.test(label)) {
      const values = [];
      cells.each((i, td) => {
        if (i > 0) values.push($(td).text().trim().replace(/\s+/g, " "));
      });
      result = { headers: headers.slice(1), values };
    }
  });
  return result;
}

function cleanValue(v) {
  return String(v || "").replace(/\s+/g, " ").replace(/^₹\s*/, "").trim();
}

function extractCookie(setCookieArray, name) {
  for (const c of setCookieArray || []) {
    const m = c.match(new RegExp(`(?:^|\\s)${name}=([^;]+)`));
    if (m) return m[1];
  }
  return null;
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
