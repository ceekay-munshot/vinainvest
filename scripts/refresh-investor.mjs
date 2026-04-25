#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, "data", "investors");
const SECTORS_PATH = resolve(__dirname, "sectors.json");

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

const args = parseArgs(process.argv.slice(2));
if (!args.slug || !args.url) {
  console.error("Usage: refresh-investor.mjs --slug <slug> --url <url> [--mock <path>]");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(args.slug)) {
  console.error("Invalid slug:", args.slug);
  process.exit(1);
}

const sectors = JSON.parse(readFileSync(SECTORS_PATH, "utf8"));

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});

async function run() {
  const scraped = args.mock
    ? JSON.parse(readFileSync(resolve(ROOT, args.mock), "utf8"))
    : await firecrawlScrape(args.url);
  validateScraped(scraped);

  const unknownSectors = [];
  const detail = buildDetail(scraped, unknownSectors);

  mkdirSync(DATA_DIR, { recursive: true });
  const outPath = resolve(DATA_DIR, `${args.slug}.json`);
  writeFileSync(outPath, JSON.stringify(detail, null, 2) + "\n");

  console.log(`Refreshed "${args.slug}" with ${detail.holdings.length} holdings (worth ₹${detail.worthCr} Cr).`);
  if (unknownSectors.length) {
    console.warn("Unknown sectors (defaulted to 'Other'):", unknownSectors.join(", "));
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
  if (!FIRECRAWL_KEY) throw new Error("FIRECRAWL_API_KEY env var is missing.");

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
    throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = await res.json();
  const data = json.data?.json ?? json.data?.extract ?? json.data;
  if (!data || !Array.isArray(data.holdings)) {
    throw new Error(`Firecrawl returned no structured data. Response keys: ${Object.keys(json.data || {}).join(", ")}`);
  }
  return data;
}

function validateScraped(s) {
  if (typeof s.netWorthCr !== "number" || !Number.isFinite(s.netWorthCr)) {
    throw new Error(`netWorthCr is missing or not a number: ${s.netWorthCr}`);
  }
  if (!Array.isArray(s.holdings) || s.holdings.length === 0) {
    throw new Error("holdings array is empty.");
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
