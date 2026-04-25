#!/usr/bin/env node
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
if (!args.url) {
  console.error("Usage: add-investor.mjs --url <url> [--name <name>] [--fund <fund>] [--style <style>] [--active-since <year>] [--type <type>] [--mock <path>]");
  process.exit(1);
}
if (!args.name && !args.fund) {
  console.error("At least one of --name or --fund is required.");
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

  const slug = slugifyKey(args.name || args.fund);
  const detailPath = resolve(DATA_DIR, `${slug}.json`);
  if (existsSync(detailPath)) {
    throw new Error(`Investor "${slug}" already exists at ${detailPath}. Use refresh-investor for updates.`);
  }

  const unknownSectors = [];
  const detail = buildDetail(scraped, args, unknownSectors);
  const registryEntry = buildRegistryEntry(args);

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(detailPath, JSON.stringify(detail, null, 2) + "\n");

  const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
  if (registry.some((r) => slugifyKey(r.name || r.fund) === slug)) {
    throw new Error(`Investor "${slug}" is already in investors.json. Refusing to duplicate.`);
  }
  registry.push(registryEntry);
  writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");

  console.log(`Registered "${args.name || args.fund}" (slug=${slug}) with ${detail.holdings.length} holdings.`);
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
  if (out["active-since"]) out.activeSince = out["active-since"];
  return out;
}

async function firecrawlScrape(url) {
  if (!FIRECRAWL_KEY) throw new Error("FIRECRAWL_API_KEY env var is missing.");

  const schema = {
    type: "object",
    properties: {
      netWorthCr: {
        type: "number",
        description: "Net worth in Indian Crores. If shown as 'Net Worth ₹3,500 Cr', return 3500."
      },
      holdings: {
        type: "array",
        description: "Every row of the active-stocks holdings table. Include all rows.",
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

function buildDetail(scraped, args, unknownList) {
  return {
    lastScrapedAt: new Date().toISOString(),
    worthCr: Math.round(scraped.netWorthCr),
    type: args.type || "Individual",
    activeSince: args.activeSince || "—",
    style: args.style || "Diversified equity",
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

function buildRegistryEntry(args) {
  const entry = {};
  if (args.name) entry.name = args.name;
  if (args.fund) entry.fund = args.fund;
  entry.url = args.url;
  return entry;
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
