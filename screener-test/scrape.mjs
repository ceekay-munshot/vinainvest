#!/usr/bin/env node
// Test scraper for a Screener.in saved screen.
// Pages through the screen's HTML tables using your sessionid cookie so
// custom columns are served, then writes CSV + JSON to ./output/.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "output");

const SESSIONID = process.env.SCREENER_SESSIONID;
const screenUrl = process.env.SCREEN_URL || "https://www.screener.in/screens/3675118/fundatest1-klp/";
const maxPages = Number(process.env.MAX_PAGES || "25");

if (!SESSIONID) {
  console.error("SCREENER_SESSIONID secret is not set. Add it under repo Settings -> Secrets and variables -> Actions.");
  process.exit(1);
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });
  const base = screenUrl.split("?")[0].replace(/\/+$/, "");

  let headers = null;
  const allRows = [];
  let totalPages = 1;

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = `${base}/?page=${page}`;
    process.stdout.write(`Fetching page ${page} ... `);

    const res = await fetch(pageUrl, {
      headers: {
        Cookie: `sessionid=${SESSIONID}`,
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!res.ok) {
      console.log(`HTTP ${res.status}`);
      if (page === 1) throw new Error(`First page returned HTTP ${res.status}.`);
      break;
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const table = $("table.data-table").first();

    if (!table.length) {
      console.log("no data table found");
      if (page === 1) {
        throw new Error("No data table on page 1 — the sessionid cookie may be invalid/expired or the page layout changed.");
      }
      break;
    }

    if (!headers) {
      headers = [];
      table.find("thead th").each((_, th) => {
        headers.push($(th).text().trim().replace(/\s+/g, " "));
      });
    }

    let pageRows = 0;
    table.find("tbody tr").each((_, tr) => {
      const cells = [];
      $(tr).find("td").each((_, td) => {
        cells.push($(td).text().trim().replace(/\s+/g, " "));
      });
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

  if (!headers || !allRows.length) {
    throw new Error("Scrape produced no rows.");
  }

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

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
