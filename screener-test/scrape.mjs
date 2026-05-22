#!/usr/bin/env node
// Test scraper for a Screener.in saved screen.
// Logs in with SCREENER_EMAIL / SCREENER_PASSWORD (so custom columns are
// served), pages through the screen's HTML tables, and writes CSV + JSON
// to ./output/. Falls back to a SCREENER_SESSIONID cookie if provided.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "output");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const EMAIL = process.env.SCREENER_EMAIL;
const PASSWORD = process.env.SCREENER_PASSWORD;
const FALLBACK_SESSIONID = process.env.SCREENER_SESSIONID;
const screenUrl = process.env.SCREEN_URL || "https://www.screener.in/screens/3675118/fundatest1-klp/";
const maxPages = Number(process.env.MAX_PAGES || "25");

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
    console.log("Login OK.");
  } else if (FALLBACK_SESSIONID) {
    console.log("Using SCREENER_SESSIONID cookie (no credentials provided).");
    cookie = `sessionid=${FALLBACK_SESSIONID}`;
  } else {
    throw new Error("Set SCREENER_EMAIL + SCREENER_PASSWORD (recommended) or SCREENER_SESSIONID in repo secrets.");
  }

  const base = screenUrl.split("?")[0].replace(/\/+$/, "");
  let headers = null;
  const allRows = [];
  let totalPages = 1;

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = `${base}/?page=${page}`;
    process.stdout.write(`Fetching page ${page} ... `);

    const res = await fetch(pageUrl, {
      headers: {
        Cookie: cookie,
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!res.ok) {
      console.log(`HTTP ${res.status}`);
      if (page === 1) throw new Error(`First page returned HTTP ${res.status}.`);
      break;
    }

    const $ = cheerio.load(await res.text());
    const table = $("table.data-table").first();
    if (!table.length) {
      console.log("no data table found");
      if (page === 1) throw new Error("No data table on page 1 — login may have failed or the layout changed.");
      break;
    }

    if (!headers) {
      headers = [];
      table.find("thead th").each((_, th) => headers.push($(th).text().trim().replace(/\s+/g, " ")));
    }

    let pageRows = 0;
    table.find("tbody tr").each((_, tr) => {
      const cells = [];
      $(tr).find("td").each((_, td) => cells.push($(td).text().trim().replace(/\s+/g, " ")));
      if (cells.length && cells.some((c) => c) && /^\d/.test(cells[0])) {
        allRows.push(cells);
        pageRows++;
      }
    });

    const match = $("body").text().match(/page\s+\d+\s+of\s+(\d+)/i);
    if (match) totalPages = Number(match[1]);

    console.log(`${pageRows} rows (page ${page} of ${totalPages})`);
    if (page >= totalPages) break;
    await new Promise((r) => setTimeout(r, 700));
  }

  if (!headers || !allRows.length) throw new Error("Scrape produced no rows.");

  const csv = [headers, ...allRows].map((row) => row.map(csvCell).join(",")).join("\n");
  writeFileSync(resolve(OUT_DIR, "screener-screen.csv"), csv + "\n");
  const json = allRows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
  writeFileSync(resolve(OUT_DIR, "screener-screen.json"), JSON.stringify(json, null, 2) + "\n");

  console.log("\n=== Done ===");
  console.log(`Columns scraped: ${headers.join(" | ")}`);
  console.log(`Total rows: ${allRows.length}`);
  console.log("First 3 rows:");
  allRows.slice(0, 3).forEach((r) => console.log("  " + r.join(" | ")));
  console.log("\nFiles written to screener-test/output/ (download from the workflow artifact).");
}

async function login(email, password) {
  const loginUrl = "https://www.screener.in/login/";
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
  if (!sessionid) {
    throw new Error("Login failed — no sessionid returned. Check SCREENER_EMAIL / SCREENER_PASSWORD.");
  }
  const newCsrf = extractCookie(postRes.headers.getSetCookie(), "csrftoken") || csrftoken;
  return `sessionid=${sessionid}; csrftoken=${newCsrf}`;
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
