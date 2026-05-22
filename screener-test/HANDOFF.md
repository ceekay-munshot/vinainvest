# Screener Scraper — Handoff

Copy this entire file's contents and paste it as the first message in a new
Claude Code session opened on the target repo. It will rebuild the working
scraper exactly.

---

## PROMPT FOR THE NEW SESSION (everything below this line)

Set up a Screener.in scraper in this repo: a GitHub Actions workflow plus a
Node script. It has already been built and proven working in another repo —
recreate the two files below **exactly**, then commit and push to `main`.

### What it does
- Logs into Screener.in with a headless browser (Playwright) using credentials
  from GitHub Actions secrets.
- Reads the live company list from a saved Screener "screen" (all paginated
  result pages).
- Visits each company page, waits for Screener's JavaScript to inject the
  account's custom "ribbon" ratios, then extracts every ratio.
- Also parses 3 server-rendered tables per company: Quarterly Results (last 4
  quarters of Net Profit), Cash Flow (Cash from Operating Activity — last and
  preceding year), and Profit & Loss (OPM % — 5-year average).
- Writes `screener-companies.csv` + `.json` into `screener-test/output/`,
  uploaded as a downloadable workflow artifact.

### Critical technical notes — do NOT "simplify" these away
- Screener injects the custom ribbon ratios with **JavaScript**. A plain HTTP
  fetch only ever sees the 9 default ratios. A real headless browser
  (Playwright) is **required**. After loading a company page the scraper waits
  for `#top-ratios li` count to exceed 9 before extracting.
- The screen's filter is dynamic — the scraper always scrapes whatever the
  screen currently returns. That is intended behaviour.
- Custom ratio configuration is **account-level** on Screener: it must be set
  up once, in a browser, on the exact account whose credentials go into the
  secrets.

### Step 1 — create `screener-test/scrape.mjs` with exactly this content:

```javascript
#!/usr/bin/env node
// Screener.in screen scraper (headless-browser version).
// Screener injects custom ribbon ratios via JavaScript, so a plain fetch
// only sees the 9 default ratios. This uses Playwright (headless Chrome)
// to render each page fully before extracting.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "output");
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ORIGIN = "https://www.screener.in";

const EMAIL = process.env.SCREENER_EMAIL;
const PASSWORD = process.env.SCREENER_PASSWORD;
const screenUrl = process.env.SCREEN_URL || "https://www.screener.in/screens/3675531/fundareal-klp-final/";
const maxPages = Number(process.env.MAX_PAGES || "30");
const maxCompanies = Number(process.env.MAX_COMPANIES || "0"); // 0 = all

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});

async function run() {
  if (!EMAIL || !PASSWORD) throw new Error("Set SCREENER_EMAIL + SCREENER_PASSWORD in repo secrets.");
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: UA });
  const page = await context.newPage();

  try {
    console.log("Logging in to Screener...");
    await loginViaBrowser(page);
    console.log("Login OK.\n");

    const base = screenUrl.split("?")[0].replace(/\/+$/, "");
    const companies = await fetchScreenCompanies(page, base);
    console.log(`\nScreen returned ${companies.length} companies.`);
    if (!companies.length) throw new Error("Screen returned no companies.");

    const limit = maxCompanies > 0 ? Math.min(maxCompanies, companies.length) : companies.length;
    console.log(`Scraping ${limit} company pages...\n`);

    const rows = [];
    const allKeys = new Set(["Company", "Screener URL"]);
    let failures = 0;

    for (let i = 0; i < limit; i++) {
      const c = companies[i];
      process.stdout.write(`[${i + 1}/${limit}] ${c.name} ... `);
      try {
        const data = await fetchCompanyData(page, c.path, i === 0);
        const row = { Company: c.name, "Screener URL": `${ORIGIN}${c.path}`, ...data };
        Object.keys(data).forEach((k) => allKeys.add(k));
        rows.push(row);
        console.log(`${Object.keys(data).length} fields`);
      } catch (err) {
        failures++;
        rows.push({ Company: c.name, "Screener URL": `${ORIGIN}${c.path}`, Error: err.message });
        console.log(`FAILED: ${err.message}`);
      }
      await sleep(300);
    }

    const headers = [...allKeys];
    const csv = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))]
      .map((line) => line.map(csvCell).join(","))
      .join("\n");
    writeFileSync(resolve(OUT_DIR, "screener-companies.csv"), csv + "\n");
    writeFileSync(resolve(OUT_DIR, "screener-companies.json"), JSON.stringify(rows, null, 2) + "\n");

    console.log("\n=== Done ===");
    console.log(`Companies scraped: ${rows.length} (${failures} failed)`);
    console.log(`Columns found: ${headers.length}`);
    console.log(`Columns: ${headers.join(" | ")}`);
  } finally {
    await browser.close();
  }
}

async function loginViaBrowser(page) {
  await page.goto(`${ORIGIN}/login/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[name="username"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([
    page.waitForLoadState("domcontentloaded").catch(() => {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(1500);
  const html = await page.content();
  if (!/\/logout\//.test(html)) {
    throw new Error("Login failed — check SCREENER_EMAIL / SCREENER_PASSWORD.");
  }
}

async function fetchScreenCompanies(page, base) {
  const companies = [];
  const seen = new Set();
  let totalPages = 1;

  for (let p = 1; p <= maxPages; p++) {
    process.stdout.write(`Reading screen page ${p} ... `);
    await page.goto(`${base}/?page=${p}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const $ = cheerio.load(await page.content());
    const table = $("table.data-table").first();
    if (!table.length) {
      console.log("no table");
      if (p === 1) throw new Error("No data table on screen page 1.");
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
    console.log(`${added} companies (page ${p} of ${totalPages})`);
    if (p >= totalPages) break;
    await sleep(300);
  }
  return companies;
}

async function fetchCompanyData(page, path, debug = false) {
  await page.goto(`${ORIGIN}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Wait for JS to inject custom ribbon ratios (defaults are 9).
  await page
    .waitForFunction(() => document.querySelectorAll("#top-ratios li").length > 9, { timeout: 12000 })
    .catch(() => {});
  await page.waitForTimeout(800);

  const html = await page.content();
  if (debug) {
    writeFileSync(resolve(OUT_DIR, "_debug-first-company.html"), html);
  }
  const $ = cheerio.load(html);

  const data = {};
  $("#top-ratios li").each((_, li) => {
    const name = $(li).find(".name").text().trim().replace(/\s+/g, " ");
    const value = $(li).find(".value").text().trim().replace(/\s+/g, " ");
    if (name) data[name] = cleanValue(value);
  });
  if (!Object.keys(data).length) throw new Error("no #top-ratios block found");

  const npq = parseSectionRow($, "#quarters", /^net profit/i);
  if (npq && npq.values.length) {
    const last4 = npq.values.slice(-4);
    data["Net Profit Qtr (latest)"] = last4[3] ?? "";
    data["Net Profit Qtr (-1)"] = last4[2] ?? "";
    data["Net Profit Qtr (-2)"] = last4[1] ?? "";
    data["Net Profit Qtr (-3)"] = last4[0] ?? "";
  }

  const cf = parseSectionRow($, "#cash-flow", /cash from operating/i);
  if (cf && cf.values.length) {
    const yearly = cf.headers
      .map((h, i) => ({ h, v: cf.values[i] }))
      .filter((p) => p.v !== undefined && !/ttm/i.test(p.h))
      .map((p) => p.v);
    data["CF Operations LY"] = yearly[yearly.length - 1] ?? "";
    data["CF Operations PY"] = yearly[yearly.length - 2] ?? "";
  }

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

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
```

### Step 2 — create `.github/workflows/screener-scrape-test.yml` with exactly this content:

```yaml
name: Screener scrape test

on:
  workflow_dispatch:
    inputs:
      url:
        description: "Screener saved-screen URL"
        required: true
        type: string
        default: "https://www.screener.in/screens/3675531/fundareal-klp-final/"
      max_companies:
        description: "How many companies to scrape (0 = all). Use a small number for a quick test."
        required: false
        type: string
        default: "15"
      max_pages:
        description: "Safety cap on screen pages to read"
        required: false
        type: string
        default: "30"

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: |
          npm install playwright@1 cheerio@1 --no-save
          npx playwright install --with-deps chromium

      - name: Run scraper
        env:
          SCREENER_EMAIL: ${{ secrets.SCREENER_EMAIL }}
          SCREENER_PASSWORD: ${{ secrets.SCREENER_PASSWORD }}
          SCREEN_URL: ${{ inputs.url }}
          MAX_COMPANIES: ${{ inputs.max_companies }}
          MAX_PAGES: ${{ inputs.max_pages }}
        run: node screener-test/scrape.mjs

      - name: Upload scraped data
        uses: actions/upload-artifact@v4
        with:
          name: screener-data
          path: screener-test/output/
          if-no-files-found: warn
```

### Step 3 — commit both files and push to `main`.

That's all the code. After it's pushed, the repo owner does the manual setup
(below) — you don't need to do anything else.

---

## MANUAL SETUP (done by the repo owner, after the code is pushed)

1. **Add two GitHub secrets** — repo Settings → Secrets and variables → Actions
   → New repository secret:
   - `SCREENER_EMAIL` — the Screener account email
   - `SCREENER_PASSWORD` — that account's password
2. The Screener account must already have the desired custom ratios configured
   in the company-page ribbon (Edit Ratios), done in a browser while logged
   into that exact account.
3. **Run it** — Actions tab → "Screener scrape test" → Run workflow. Set the
   `url` to the saved screen, keep `max_companies = 15` for a quick test, then
   set it to `0` for the full run.
4. Download the `screener-data` artifact from the finished run for the
   CSV/JSON output.
