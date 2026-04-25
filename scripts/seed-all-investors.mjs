#!/usr/bin/env node
// Bulk-seed: walk investors.json, scrape any investor without a detail file
// (or all of them with --force). Writes data/investors/<slug>.json per investor.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REGISTRY = resolve(ROOT, "investors.json");
const DATA_DIR = resolve(ROOT, "data", "investors");
const SECTORS_PATH = resolve(__dirname, "sectors.json");

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

const args = parseArgs(process.argv.slice(2));
const force = args.force === true || args.force === "true";
const onlySlug = args["only-slug"] || null;
const limit = args.limit ? Number(args.limit) : Infinity;

const sectors = JSON.parse(readFileSync(SECTORS_PATH, "utf8"));
const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));

run().catch((err) => {
  console.error("Bulk seed failed:", err.message);
  process.exit(1);
});

async function run() {
  if (!FIRECRAWL_KEY) throw new Error("FIRECRAWL_API_KEY env var is missing.");
  mkdirSync(DATA_DIR, { recursive: true });

  const succeeded = [];
  const skipped = [];
  const failed = [];
  let processed = 0;

  for (const entry of registry) {
    if (processed >= limit) break;
    const slug = slugifyKey(entry.name || entry.fund);
    if (!slug) {
      failed.push({ entry, reason: "could not derive slug" });
      continue;
    }
    if (onlySlug && slug !== onlySlug) continue;
    if (!entry.url) {
      skipped.push({ slug, reason: "no url in registry" });
      continue;
    }

    const detailPath = resolve(DATA_DIR, `${slug}.json`);
    if (existsSync(detailPath) && !force) {
      skipped.push({ slug, reason: "already has detail file" });
      continue;
    }

    processed++;
    process.stdout.write(`[${processed}] Scraping ${slug} ... `);
    try {
      const scraped = await firecrawlScrape(entry.url);
      validateScraped(scraped);
      const unknownList = [];
      const detail = buildDetail(scraped, unknownList);
      writeFileSync(detailPath, JSON.stringify(detail, null, 2) + "\n");
      console.log(`ok (${detail.holdings.length} holdings, ₹${detail.worthCr} Cr)`);
      succeeded.push({ slug, holdings: detail.holdings.length, worthCr: detail.worthCr, unknownSectors: unknownList });
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed.push({ slug, reason: err.message });
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Succeeded: ${succeeded.length}`);
  console.log(`Skipped:   ${skipped.length}`);
  console.log(`Failed:    ${failed.length}`);
  if (skipped.length) {
    console.log("\nSkipped (first 10):");
    skipped.slice(0, 10).forEach((s) => console.log(`  ${s.slug}: ${s.reason}`));
  }
  if (failed.length) {
    console.log("\nFailed:");
    failed.forEach((f) => console.log(`  ${f.slug || "?"}: ${f.reason}`));
    process.exit(1);
  }

  const allUnknown = new Set(succeeded.flatMap((s) => s.unknownSectors));
  if (allUnknown.size) {
    console.log(`\n${allUnknown.size} unknown sector(s) defaulted to 'Other':`);
    [...allUnknown].sort().forEach((s) => console.log(`  ${s}`));
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

async function firecrawlScrape(url) {
  const schema = {
    type: "object",
    properties: {
      netWorthCr: { type: "number", description: "Net worth in Indian Crores; strip ₹ and 'Cr'." },
      holdings: {
        type: "array",
        description: "Every row of the active-stocks holdings table.",
        items: {
          type: "object",
          properties: {
            company: { type: "string" },
            jun2025Pct: { type: ["number", "null"] },
            aug2025Pct: { type: ["number", "null"] },
            sep2025Pct: { type: ["number", "null"] },
            dec2025Pct: { type: ["number", "null"] },
            mar2026Pct: { type: ["number", "null"] },
            valueCr: { type: "number" }
          },
          required: ["company", "valueCr"]
        }
      }
    },
    required: ["holdings", "netWorthCr"]
  };

  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      formats: [{ type: "json", schema }],
      onlyMainContent: true,
      waitFor: 2000
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const data = json.data?.json ?? json.data?.extract ?? json.data;
  if (!data || !Array.isArray(data.holdings)) {
    throw new Error(`no structured data; keys: ${Object.keys(json.data || {}).join(",")}`);
  }
  return data;
}

function validateScraped(s) {
  if (typeof s.netWorthCr !== "number" || !Number.isFinite(s.netWorthCr)) {
    throw new Error(`netWorthCr missing/invalid: ${s.netWorthCr}`);
  }
  if (!Array.isArray(s.holdings) || s.holdings.length === 0) {
    throw new Error("holdings empty");
  }
}

function buildDetail(scraped, unknownList) {
  return {
    lastScrapedAt: new Date().toISOString(),
    worthCr: Math.round(scraped.netWorthCr),
    type: "Individual",
    activeSince: "—",
    style: "Diversified equity",
    holdings: scraped.holdings.map((row) => ({
      company: row.company.trim(),
      sector: lookupSector(row.company, unknownList),
      stakes: {
        jun25: numOrNull(row.jun2025Pct),
        aug25: numOrNull(row.aug2025Pct),
        sep25: numOrNull(row.sep2025Pct),
        dec25: numOrNull(row.dec2025Pct),
        mar26: numOrNull(row.mar2026Pct)
      },
      valueCr: Math.round(Number(row.valueCr) || 0)
    }))
  };
}

function slugifyKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function lookupSector(company, unknownList) {
  if (!company) return "Other";
  const trimmed = company.trim().replace(/\s+(Ltd\.?|Limited|Inc\.?)$/i, "").trim();
  const candidates = [trimmed, trimmed.replace(/\s*\(.*?\)\s*/g, "").trim()];
  for (const k of candidates) if (sectors[k]) return sectors[k];
  const lowered = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(sectors)) {
    if (key.toLowerCase() === lowered) return value;
  }
  if (!unknownList.includes(trimmed)) unknownList.push(trimmed);
  return "Other";
}

function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
