#!/usr/bin/env node
// One-time migration: extract `const investors = [...]` from script.js
// and split it into investors.json (registry) + data/investors/<slug>.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCRIPT_JS = resolve(ROOT, "script.js");
const REGISTRY = resolve(ROOT, "investors.json");
const DATA_DIR = resolve(ROOT, "data", "investors");

const KNOWN_URLS = {
  "sunil-singhania": "https://ticker.finology.in/investor/abakkus-fund-sunil-singhania"
};

const src = readFileSync(SCRIPT_JS, "utf8");
const startIdx = src.indexOf("const investors =");
if (startIdx === -1) throw new Error("could not find investors array");
const arrayStart = src.indexOf("[", startIdx);

let depth = 0;
let i = arrayStart;
let inString = false;
let stringChar = "";
let escape = false;
while (i < src.length) {
  const c = src[i];
  if (escape) {
    escape = false;
  } else if (inString) {
    if (c === "\\") escape = true;
    else if (c === stringChar) inString = false;
  } else {
    if (c === '"' || c === "'" || c === "`") {
      inString = true;
      stringChar = c;
    } else if (c === "[") {
      depth++;
    } else if (c === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  i++;
}
const arrayLiteral = src.slice(arrayStart, i + 1);
const investors = new Function(`return ${arrayLiteral}`)();

mkdirSync(DATA_DIR, { recursive: true });

const registry = [];
for (const inv of investors) {
  const slug = slugify(inv.name || inv.fund);
  const url = KNOWN_URLS[inv.id] || KNOWN_URLS[slug] || "";
  registry.push({
    name: inv.name || undefined,
    fund: inv.fund || undefined,
    url
  });

  const detail = {
    lastScrapedAt: null,
    worthCr: inv.worthCr,
    type: inv.type,
    activeSince: inv.activeSince,
    style: inv.style,
    holdings: inv.holdings.map((h) => ({
      company: h.company,
      sector: h.sector,
      stakes: {
        jun25: h.jun25 ?? null,
        aug25: h.aug25 ?? null,
        sep25: h.sep25 ?? null,
        dec25: h.dec25 ?? null,
        mar26: h.mar26 ?? null
      },
      valueCr: h.valueCr || 0
    }))
  };

  writeFileSync(resolve(DATA_DIR, `${slug}.json`), JSON.stringify(detail, null, 2) + "\n");
}

const cleanRegistry = registry.map((r) => {
  const out = {};
  if (r.name) out.name = r.name;
  if (r.fund) out.fund = r.fund;
  out.url = r.url;
  return out;
});

writeFileSync(REGISTRY, JSON.stringify(cleanRegistry, null, 2) + "\n");

console.log(`Wrote registry with ${cleanRegistry.length} entries to investors.json`);
console.log(`Wrote ${cleanRegistry.length} per-investor files under data/investors/`);

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
