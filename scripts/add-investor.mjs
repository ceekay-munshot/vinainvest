#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SCRIPT_JS = resolve(ROOT, "script.js");
const SECTORS_PATH = resolve(__dirname, "sectors.json");

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const args = parseArgs(process.argv.slice(2));
if (!args.url || !args.name) {
  console.error("Usage: add-investor.mjs --url <url> --name <name> [--fund <fund>] [--style <style>] [--active-since <year>] [--mock <path>]");
  process.exit(1);
}

const sectors = JSON.parse(readFileSync(SECTORS_PATH, "utf8"));
const PALETTE = ["#173a69", "#1f5ea8", "#317a85", "#5d7392", "#9db0c8", "#7a4a86", "#b07a3a", "#3a7a5d"];

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});

async function run() {
  const scraped = args.mock
    ? JSON.parse(readFileSync(resolve(ROOT, args.mock), "utf8"))
    : await firecrawlScrape(args.url);

  validateScraped(scraped);

  const investor = buildInvestor(scraped, args);
  const insertion = serializeInvestor(investor);

  const original = readFileSync(SCRIPT_JS, "utf8");
  if (original.includes(`id: "${investor.id}"`)) {
    throw new Error(`Investor id "${investor.id}" already exists in script.js. Refusing to overwrite.`);
  }

  const anchor = "  }\n];\n\nconst directoryView";
  if (!original.includes(anchor)) {
    throw new Error("Could not locate insertion anchor in script.js. The file structure may have changed.");
  }
  const updated = original.replace(anchor, `  },\n${insertion}\n];\n\nconst directoryView`);

  writeFileSync(SCRIPT_JS, updated);
  console.log(`Inserted investor "${investor.name}" (id=${investor.id}) with ${investor.holdings.length} holdings.`);
  if (investor._unknownSectors.length) {
    console.warn("Unknown sectors (defaulted to 'Other'):", investor._unknownSectors.join(", "));
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
      investorName: { type: "string" },
      netWorthCr: {
        type: "number",
        description: "Net worth in Indian Crores. If shown as 'Net Worth ₹3,500 Cr', return 3500. Strip currency symbols and units."
      },
      activeStocksCount: { type: "number", description: "Number of active stocks held." },
      totalStocksCount: { type: "number", description: "Total stocks owned (active + exited / inactive)." },
      holdings: {
        type: "array",
        description: "Every row of the active-stocks holdings table. Include all rows, not just visible ones.",
        items: {
          type: "object",
          properties: {
            company: { type: "string", description: "Company name as displayed in the table." },
            jun2025Pct: { type: ["number", "null"], description: "Stake percentage for Jun 2025 column. null if blank or '-'." },
            aug2025Pct: { type: ["number", "null"], description: "Stake percentage for Aug 2025 column." },
            sep2025Pct: { type: ["number", "null"], description: "Stake percentage for Sep 2025 column." },
            dec2025Pct: { type: ["number", "null"], description: "Stake percentage for Dec 2025 column." },
            mar2026Pct: { type: ["number", "null"], description: "Stake percentage for Mar 2026 column." },
            valueCr: { type: "number", description: "Holding value in Indian Crores. Return 0 if blank or 0.00." }
          },
          required: ["company", "valueCr"]
        }
      }
    },
    required: ["holdings", "netWorthCr"]
  };

  const body = {
    url,
    formats: [{ type: "json", schema }],
    onlyMainContent: true,
    waitFor: 2000
  };

  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
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
  for (const h of s.holdings) {
    if (!h.company) throw new Error(`Holding missing company name: ${JSON.stringify(h)}`);
  }
}

function buildInvestor(scraped, args) {
  const name = args.name;
  const fund = args.fund || `${name} Portfolio`;
  const id = slugify(name);
  const initials = initialsFor(name);
  const worthCr = Math.round(scraped.netWorthCr);
  const unknownSectors = [];

  const holdings = scraped.holdings.map((row) => {
    const sector = lookupSector(row.company, unknownSectors);
    const jun25 = numOrNull(row.jun2025Pct);
    const aug25 = numOrNull(row.aug2025Pct);
    const sep25 = numOrNull(row.sep2025Pct);
    const dec25 = numOrNull(row.dec2025Pct);
    const mar26 = numOrNull(row.mar2026Pct);
    const valueCr = Math.round(Number(row.valueCr) || 0);
    const status = computeStatus({ jun25, aug25, sep25, dec25, mar26 });
    return { company: row.company.trim(), sector, jun25, aug25, sep25, dec25, mar26, valueCr, status };
  });

  const activeHoldings = holdings.filter((h) => h.status !== "Exited");
  const holdingsCount = scraped.activeStocksCount || activeHoldings.length;

  const sectorTotals = aggregateBySector(holdings);
  const sectorFocus = sectorTotals.slice(0, 3).map((s) => s.sector);
  const totalValue = holdings.reduce((sum, h) => sum + h.valueCr, 0);

  const sectorAllocation = buildSectorAllocation(sectorTotals, totalValue);
  const topHoldings = holdings
    .filter((h) => h.valueCr > 0)
    .sort((a, b) => b.valueCr - a.valueCr)
    .slice(0, 4)
    .map((h) => ({ company: h.company, sector: h.sector, value: formatCr(h.valueCr) }));

  const counts = countStatuses(holdings);
  const kpis = [
    { label: "Total Portfolio Value", value: formatCr(worthCr), note: "Latest market value estimate" },
    { label: "Active Holdings", value: pad2(holdingsCount), note: "Disclosed live positions" },
    { label: "New Additions", value: pad2(counts.New), note: "Positions initiated this quarter" },
    { label: "Increased Stakes", value: pad2(counts.Increased), note: "Meaningful ownership increases" },
    { label: "Reduced Stakes", value: pad2(counts.Reduced), note: "Portfolio trims" },
    { label: "Exits / Inactive", value: pad2(counts.Exited), note: "Exited or filing due" }
  ];

  const concentration = concentrationLabel(sectorAllocation);
  const concentrationSummary = buildConcentrationSummary(holdings, totalValue);
  const themeSummary = buildThemeSummary(sectorFocus, concentration);
  const timeline = buildTimeline(holdings);
  const notes = buildNotes(sectorFocus, concentration);
  const description = `Portfolio anchored in ${sectorFocus.slice(0, 3).join(", ").toLowerCase()} with ${holdingsCount} disclosed live positions.`;
  const bio = `Tracked public-equity portfolio with ${holdingsCount} active holdings and a current disclosed value of ${formatCr(worthCr)}.`;

  return {
    id,
    name,
    initials,
    fund,
    type: args.type || "Individual",
    worthCr,
    holdingsCount,
    sectorFocus,
    activity: activityLabel(counts),
    description,
    bio,
    activeSince: args.activeSince || "—",
    style: args.style || "Diversified equity",
    concentration,
    keySectors: sectorFocus.join(", "),
    kpis,
    topHoldings,
    sectorAllocation,
    timeline,
    concentrationSummary,
    themeSummary,
    notes,
    holdings,
    _unknownSectors: unknownSectors
  };
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initialsFor(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function lookupSector(company, unknownList) {
  if (!company) return "Other";
  const trimmed = company.trim().replace(/\s+(Ltd\.?|Limited|Inc\.?)$/i, "").trim();
  const candidates = [trimmed, trimmed.replace(/\s*\(.*?\)\s*/g, "").trim()];
  for (const k of candidates) {
    if (sectors[k]) return sectors[k];
  }
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

function computeStatus({ jun25, aug25, sep25, dec25, mar26 }) {
  const series = [jun25, aug25, sep25, dec25, mar26];
  const present = series.map((v) => v !== null && v !== undefined);
  const allNull = present.every((p) => !p);
  if (allNull) return "Unchanged";

  if (mar26 === null && present.slice(0, 4).some((p) => p)) return "Exited";
  const earlierPresent = present.slice(0, 4).some((p) => p);
  if (mar26 !== null && !earlierPresent) return "New";

  const earliest = series.find((v) => v !== null && v !== undefined);
  if (earliest === undefined || mar26 === null) return "Unchanged";

  const diff = mar26 - earliest;
  if (Math.abs(diff) < 0.005) return "Unchanged";
  return diff > 0 ? "Increased" : "Reduced";
}

function aggregateBySector(holdings) {
  const map = new Map();
  for (const h of holdings) {
    map.set(h.sector, (map.get(h.sector) || 0) + h.valueCr);
  }
  return [...map.entries()]
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value);
}

function buildSectorAllocation(sectorTotals, totalValue) {
  if (totalValue <= 0) return [];
  const top = sectorTotals.slice(0, 4);
  const rest = sectorTotals.slice(4);
  const restSum = rest.reduce((sum, s) => sum + s.value, 0);

  const entries = top.map((s, i) => ({
    sector: s.sector,
    value: Math.round((s.value / totalValue) * 100),
    amount: formatCr(s.value),
    color: PALETTE[i]
  }));
  if (restSum > 0) {
    entries.push({
      sector: "Others",
      value: Math.round((restSum / totalValue) * 100),
      amount: formatCr(restSum),
      color: PALETTE[Math.min(top.length, PALETTE.length - 1)]
    });
  }

  const sumPct = entries.reduce((s, e) => s + e.value, 0);
  const drift = 100 - sumPct;
  if (entries.length && drift !== 0) entries[0].value += drift;
  return entries;
}

function buildConcentrationSummary(holdings, totalValue) {
  if (totalValue <= 0) {
    return { title: "Insufficient data for concentration", body: "Holdings have no disclosed market value.", topFive: 0, topTen: 0 };
  }
  const sorted = [...holdings].sort((a, b) => b.valueCr - a.valueCr);
  const top5 = sorted.slice(0, 5).reduce((s, h) => s + h.valueCr, 0);
  const top10 = sorted.slice(0, 10).reduce((s, h) => s + h.valueCr, 0);
  const top5Pct = Math.round((top5 / totalValue) * 100);
  const top10Pct = Math.round((top10 / totalValue) * 100);
  const body = top5Pct > 60
    ? "Portfolio is deliberately concentrated, with the leading positions doing most of the heavy lifting."
    : top5Pct > 45
      ? "Portfolio carries meaningful concentration in the top names while retaining breadth elsewhere."
      : "Portfolio is broadly diversified with no single position dominating the book.";
  return {
    title: `Top 5 holdings account for ${top5Pct}% of portfolio value`,
    body,
    topFive: top5Pct,
    topTen: top10Pct
  };
}

function buildThemeSummary(sectorFocus, concentration) {
  const sectorList = sectorFocus.join(", ").toLowerCase();
  if (concentration === "High") {
    return {
      title: "Concentrated conviction book",
      body: `The current mix leans into ${sectorList}. Turnover is measured rather than tactical, with sizing weighted toward the highest-conviction names.`
    };
  }
  if (concentration === "Medium") {
    return {
      title: "Balanced sector exposure",
      body: `Exposure is distributed across ${sectorList}, leaving room for tactical trims without changing the overall posture.`
    };
  }
  return {
    title: "Diversified opportunity book",
    body: `Wider breadth across ${sectorList} suits an exploratory style with room for fresh themes alongside the core book.`
  };
}

function buildTimeline(holdings) {
  const today = new Date();
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const recent = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    return fmt(d);
  };
  const events = [];
  const news = holdings.filter((h) => h.status === "New").slice(0, 1);
  const ups = holdings.filter((h) => h.status === "Increased").sort((a, b) => (b.mar26 || 0) - (a.mar26 || 0)).slice(0, 1);
  const downs = holdings.filter((h) => h.status === "Reduced").slice(0, 1);
  const exits = holdings.filter((h) => h.status === "Exited").slice(0, 1);

  for (const h of news) {
    events.push({ date: recent(7), title: `New disclosure in ${h.company}`, body: `Fresh ${h.mar26?.toFixed(2) || "0.00"}% position adds ${h.sector.toLowerCase()} exposure.` });
  }
  for (const h of ups) {
    const earlier = [h.jun25, h.aug25, h.sep25, h.dec25].find((v) => v !== null);
    events.push({ date: recent(18), title: `Increased position in ${h.company}`, body: `Stake moved to ${h.mar26?.toFixed(2) || "—"}% from ${earlier !== undefined ? earlier.toFixed(2) : "—"}%.` });
  }
  for (const h of downs) {
    events.push({ date: recent(28), title: `Reduced ${h.company} stake`, body: `Trimmed ownership while retaining a residual position.` });
  }
  for (const h of exits) {
    events.push({ date: recent(40), title: `Exited ${h.company}`, body: `Position no longer disclosed in the latest filing.` });
  }
  if (events.length === 0) {
    events.push({ date: recent(14), title: "Portfolio largely unchanged", body: "No material position-level changes disclosed in the most recent filing." });
  }
  return events;
}

function buildNotes(sectorFocus, concentration) {
  return [
    {
      title: "Portfolio profile",
      body: `${concentration} concentration with primary exposure across ${sectorFocus.join(", ").toLowerCase()}.`
    },
    {
      title: "Watch item",
      body: "Track whether top sector exposure expands or trims further in the next disclosure cycle."
    },
    {
      title: "Research angle",
      body: "Cross-check incremental adds against earnings momentum and management commentary."
    }
  ];
}

function countStatuses(holdings) {
  const c = { New: 0, Increased: 0, Reduced: 0, Unchanged: 0, Exited: 0 };
  for (const h of holdings) c[h.status] = (c[h.status] || 0) + 1;
  return c;
}

function activityLabel(counts) {
  const churn = counts.New + counts.Increased + counts.Reduced + counts.Exited;
  if (churn >= 6) return "High";
  if (churn >= 3) return "Medium";
  return "Low";
}

function concentrationLabel(allocation) {
  if (!allocation.length) return "Medium";
  const top = allocation[0].value;
  if (top >= 35) return "High";
  if (top >= 22) return "Medium";
  return "Low";
}

function pad2(n) {
  return String(n || 0).padStart(2, "0");
}

function formatCr(value) {
  if (!value || value <= 0) return "₹0 Cr";
  const rounded = Math.round(value);
  return `₹${rounded.toLocaleString("en-IN")} Cr`;
}

function serializeInvestor(inv) {
  const lines = [];
  const indent = "  ";
  lines.push(`${indent}{`);
  lines.push(`${indent}  id: ${JSON.stringify(inv.id)},`);
  lines.push(`${indent}  name: ${JSON.stringify(inv.name)},`);
  lines.push(`${indent}  initials: ${JSON.stringify(inv.initials)},`);
  lines.push(`${indent}  fund: ${JSON.stringify(inv.fund)},`);
  lines.push(`${indent}  type: ${JSON.stringify(inv.type)},`);
  lines.push(`${indent}  worthCr: ${inv.worthCr},`);
  lines.push(`${indent}  holdingsCount: ${inv.holdingsCount},`);
  lines.push(`${indent}  sectorFocus: ${JSON.stringify(inv.sectorFocus)},`);
  lines.push(`${indent}  activity: ${JSON.stringify(inv.activity)},`);
  lines.push(`${indent}  description: ${JSON.stringify(inv.description)},`);
  lines.push(`${indent}  bio: ${JSON.stringify(inv.bio)},`);
  lines.push(`${indent}  activeSince: ${JSON.stringify(inv.activeSince)},`);
  lines.push(`${indent}  style: ${JSON.stringify(inv.style)},`);
  lines.push(`${indent}  concentration: ${JSON.stringify(inv.concentration)},`);
  lines.push(`${indent}  keySectors: ${JSON.stringify(inv.keySectors)},`);
  lines.push(`${indent}  kpis: [`);
  inv.kpis.forEach((k, i) => {
    const sep = i < inv.kpis.length - 1 ? "," : "";
    lines.push(`${indent}    { label: ${JSON.stringify(k.label)}, value: ${JSON.stringify(k.value)}, note: ${JSON.stringify(k.note)} }${sep}`);
  });
  lines.push(`${indent}  ],`);
  lines.push(`${indent}  topHoldings: [`);
  inv.topHoldings.forEach((h, i) => {
    const sep = i < inv.topHoldings.length - 1 ? "," : "";
    lines.push(`${indent}    { company: ${JSON.stringify(h.company)}, sector: ${JSON.stringify(h.sector)}, value: ${JSON.stringify(h.value)} }${sep}`);
  });
  lines.push(`${indent}  ],`);
  lines.push(`${indent}  sectorAllocation: [`);
  inv.sectorAllocation.forEach((s, i) => {
    const sep = i < inv.sectorAllocation.length - 1 ? "," : "";
    lines.push(`${indent}    { sector: ${JSON.stringify(s.sector)}, value: ${s.value}, amount: ${JSON.stringify(s.amount)}, color: ${JSON.stringify(s.color)} }${sep}`);
  });
  lines.push(`${indent}  ],`);
  lines.push(`${indent}  timeline: [`);
  inv.timeline.forEach((t, i) => {
    const sep = i < inv.timeline.length - 1 ? "," : "";
    lines.push(`${indent}    { date: ${JSON.stringify(t.date)}, title: ${JSON.stringify(t.title)}, body: ${JSON.stringify(t.body)} }${sep}`);
  });
  lines.push(`${indent}  ],`);
  lines.push(`${indent}  concentrationSummary: {`);
  lines.push(`${indent}    title: ${JSON.stringify(inv.concentrationSummary.title)},`);
  lines.push(`${indent}    body: ${JSON.stringify(inv.concentrationSummary.body)},`);
  lines.push(`${indent}    topFive: ${inv.concentrationSummary.topFive},`);
  lines.push(`${indent}    topTen: ${inv.concentrationSummary.topTen}`);
  lines.push(`${indent}  },`);
  lines.push(`${indent}  themeSummary: {`);
  lines.push(`${indent}    title: ${JSON.stringify(inv.themeSummary.title)},`);
  lines.push(`${indent}    body: ${JSON.stringify(inv.themeSummary.body)}`);
  lines.push(`${indent}  },`);
  lines.push(`${indent}  notes: [`);
  inv.notes.forEach((n, i) => {
    const sep = i < inv.notes.length - 1 ? "," : "";
    lines.push(`${indent}    { title: ${JSON.stringify(n.title)}, body: ${JSON.stringify(n.body)} }${sep}`);
  });
  lines.push(`${indent}  ],`);
  lines.push(`${indent}  holdings: [`);
  inv.holdings.forEach((h, i) => {
    const sep = i < inv.holdings.length - 1 ? "," : "";
    const fields = [
      `company: ${JSON.stringify(h.company)}`,
      `sector: ${JSON.stringify(h.sector)}`,
      `jun25: ${jsNum(h.jun25)}`,
      `aug25: ${jsNum(h.aug25)}`,
      `sep25: ${jsNum(h.sep25)}`,
      `dec25: ${jsNum(h.dec25)}`,
      `mar26: ${jsNum(h.mar26)}`,
      `valueCr: ${h.valueCr}`,
      `status: ${JSON.stringify(h.status)}`
    ].join(", ");
    lines.push(`${indent}    { ${fields} }${sep}`);
  });
  lines.push(`${indent}  ]`);
  lines.push(`${indent}}`);
  return lines.join("\n");
}

function jsNum(v) {
  if (v === null || v === undefined) return "null";
  const n = Number(v);
  return Number.isInteger(n) ? n.toFixed(2) : n.toString();
}
