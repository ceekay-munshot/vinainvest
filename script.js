let investors = [];
const QUARTER_KEYS = ["jun25", "aug25", "sep25", "dec25", "mar26"];
const SECTOR_PALETTE = ["#173a69", "#1f5ea8", "#317a85", "#5d7392", "#9db0c8", "#7a4a86", "#b07a3a", "#3a7a5d"];

async function loadInvestors() {
  const registryRes = await fetch("./investors.json", { cache: "no-store" });
  if (!registryRes.ok) throw new Error("investors.json fetch failed");
  const registry = await registryRes.json();
  const enriched = await Promise.all(
    registry.map(async (entry) => {
      const slug = slugifyInvestorKey(entry.name || entry.fund);
      try {
        const detailRes = await fetch(`./data/investors/${slug}.json`, { cache: "no-store" });
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();
        return enrichInvestor(entry, detail, slug);
      } catch (err) {
        console.error(`Failed to load investor ${slug}:`, err);
        return null;
      }
    })
  );
  return enriched.filter(Boolean);
}

function slugifyInvestorKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initialsFor(s) {
  const out = String(s || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return out || "—";
}

function pad2(n) {
  return String(n || 0).padStart(2, "0");
}

function enrichInvestor(reg, detail, slug) {
  const rawHoldings = Array.isArray(detail.holdings) ? detail.holdings : [];
  const holdings = rawHoldings.map((h) => {
    const stakes = h.stakes || {};
    return {
      company: h.company,
      sector: h.sector || "Other",
      jun25: stakes.jun25 ?? null,
      aug25: stakes.aug25 ?? null,
      sep25: stakes.sep25 ?? null,
      dec25: stakes.dec25 ?? null,
      mar26: stakes.mar26 ?? null,
      valueCr: Number(h.valueCr) || 0,
      status: computeHoldingStatus(stakes)
    };
  });

  const totalValue = holdings.reduce((s, h) => s + h.valueCr, 0);
  const sectorTotals = aggregateBySector(holdings);
  const sectorFocus = sectorTotals.slice(0, 3).map((s) => s.sector);
  const counts = countStatuses(holdings);
  const holdingsActive = holdings.filter((h) => h.status !== "Exited").length;

  const sectorAllocation = buildSectorAllocation(sectorTotals, totalValue);
  const concentration = concentrationLabel(sectorAllocation);
  const concentrationSummary = buildConcentrationSummary(holdings, totalValue);
  const themeSummary = buildThemeSummary(sectorFocus, concentration);
  const timeline = buildTimeline(holdings);
  const notes = buildNotes(sectorFocus, concentration);

  const worthCr = Number(detail.worthCr) || 0;
  const topHoldings = holdings
    .filter((h) => h.valueCr > 0)
    .sort((a, b) => b.valueCr - a.valueCr)
    .slice(0, 4)
    .map((h) => ({ company: h.company, sector: h.sector, value: currencyCr(h.valueCr) }));

  const kpis = [
    { label: "Total Portfolio Value", value: currencyCr(worthCr), note: "Latest market value estimate" },
    { label: "Active Holdings", value: pad2(holdingsActive), note: "Disclosed live positions" },
    { label: "New Additions", value: pad2(counts.New || 0), note: "Positions initiated this quarter" },
    { label: "Increased Stakes", value: pad2(counts.Increased || 0), note: "Meaningful ownership increases" },
    { label: "Reduced Stakes", value: pad2(counts.Reduced || 0), note: "Portfolio trims" },
    { label: "Exits / Inactive", value: pad2(counts.Exited || 0), note: "Exited or filing due" }
  ];

  const focusList = sectorFocus.join(", ").toLowerCase() || "diversified sectors";

  return {
    id: slug,
    name: reg.name || "",
    fund: reg.fund || "",
    initials: initialsFor(reg.name || reg.fund),
    type: detail.type || "Individual",
    sourceUrl: reg.url || "",
    lastScrapedAt: detail.lastScrapedAt || null,
    worthCr,
    holdingsCount: holdingsActive,
    sectorFocus,
    activity: activityLabel(counts),
    description: `Portfolio anchored in ${focusList} with ${holdingsActive} disclosed live positions.`,
    bio: `Tracked public-equity portfolio with ${holdingsActive} active holdings and a current disclosed value of ${currencyCr(worthCr)}.`,
    activeSince: detail.activeSince || "—",
    style: detail.style || "Diversified equity",
    concentration,
    keySectors: sectorFocus.join(", ") || "—",
    kpis,
    topHoldings,
    sectorAllocation,
    timeline,
    concentrationSummary,
    themeSummary,
    notes,
    holdings
  };
}

function computeHoldingStatus(stakes) {
  const series = QUARTER_KEYS.map((k) => stakes[k] ?? null);
  const present = series.map((v) => v !== null);
  if (present.every((p) => !p)) return "Unchanged";

  const latest = series[series.length - 1];
  const earlier = series.slice(0, -1);
  const earlierPresent = earlier.some((v) => v !== null);

  if (latest === null && earlierPresent) return "Exited";
  if (latest !== null && !earlierPresent) return "New";

  const earliest = series.find((v) => v !== null);
  if (earliest === undefined || latest === null) return "Unchanged";
  const diff = latest - earliest;
  if (Math.abs(diff) < 0.005) return "Unchanged";
  return diff > 0 ? "Increased" : "Reduced";
}

function aggregateBySector(holdings) {
  const map = new Map();
  for (const h of holdings) map.set(h.sector, (map.get(h.sector) || 0) + h.valueCr);
  return [...map.entries()].map(([sector, value]) => ({ sector, value })).sort((a, b) => b.value - a.value);
}

function buildSectorAllocation(sectorTotals, totalValue) {
  if (totalValue <= 0) return [];
  const top = sectorTotals.slice(0, 4);
  const rest = sectorTotals.slice(4);
  const restSum = rest.reduce((s, x) => s + x.value, 0);
  const entries = top.map((s, i) => ({
    sector: s.sector,
    value: Math.round((s.value / totalValue) * 100),
    amount: currencyCr(s.value),
    color: SECTOR_PALETTE[i]
  }));
  if (restSum > 0) {
    entries.push({
      sector: "Others",
      value: Math.round((restSum / totalValue) * 100),
      amount: currencyCr(restSum),
      color: SECTOR_PALETTE[Math.min(top.length, SECTOR_PALETTE.length - 1)]
    });
  }
  const drift = 100 - entries.reduce((s, e) => s + e.value, 0);
  if (entries.length && drift !== 0) entries[0].value += drift;
  return entries;
}

function buildConcentrationSummary(holdings, totalValue) {
  if (totalValue <= 0) {
    return { title: "Insufficient data", body: "Holdings have no disclosed market value.", topFive: 0, topTen: 0 };
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
  return { title: `Top 5 holdings account for ${top5Pct}% of portfolio value`, body, topFive: top5Pct, topTen: top10Pct };
}

function buildThemeSummary(sectorFocus, concentration) {
  const sectorList = sectorFocus.join(", ").toLowerCase() || "diversified sectors";
  if (concentration === "High") {
    return { title: "Concentrated conviction book", body: `The current mix leans into ${sectorList}. Turnover is measured rather than tactical.` };
  }
  if (concentration === "Medium") {
    return { title: "Balanced sector exposure", body: `Exposure is distributed across ${sectorList}, leaving room for tactical trims without changing the overall posture.` };
  }
  return { title: "Diversified opportunity book", body: `Wider breadth across ${sectorList} suits an exploratory style.` };
}

function buildTimeline(holdings) {
  const today = new Date();
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const recent = (offset) => { const d = new Date(today); d.setDate(d.getDate() - offset); return fmt(d); };
  const events = [];
  const news = holdings.filter((h) => h.status === "New").slice(0, 1);
  const ups = holdings.filter((h) => h.status === "Increased").sort((a, b) => (b.mar26 || 0) - (a.mar26 || 0)).slice(0, 1);
  const downs = holdings.filter((h) => h.status === "Reduced").slice(0, 1);
  const exits = holdings.filter((h) => h.status === "Exited").slice(0, 1);
  for (const h of news) events.push({ date: recent(7), title: `New disclosure in ${h.company}`, body: `Fresh ${h.mar26 != null ? h.mar26.toFixed(2) : "0.00"}% position adds ${h.sector.toLowerCase()} exposure.` });
  for (const h of ups) {
    const earlier = [h.jun25, h.aug25, h.sep25, h.dec25].find((v) => v !== null);
    events.push({ date: recent(18), title: `Increased position in ${h.company}`, body: `Stake moved to ${h.mar26 != null ? h.mar26.toFixed(2) : "—"}% from ${earlier !== undefined && earlier !== null ? earlier.toFixed(2) : "—"}%.` });
  }
  for (const h of downs) events.push({ date: recent(28), title: `Reduced ${h.company} stake`, body: "Trimmed ownership while retaining a residual position." });
  for (const h of exits) events.push({ date: recent(40), title: `Exited ${h.company}`, body: "Position no longer disclosed in the latest filing." });
  if (!events.length) events.push({ date: recent(14), title: "Portfolio largely unchanged", body: "No material position-level changes disclosed in the most recent filing." });
  return events;
}

function buildNotes(sectorFocus, concentration) {
  const focusList = sectorFocus.join(", ").toLowerCase() || "diversified sectors";
  return [
    { title: "Portfolio profile", body: `${concentration} concentration with primary exposure across ${focusList}.` },
    { title: "Watch item", body: "Track whether top sector exposure expands or trims further in the next disclosure cycle." },
    { title: "Research angle", body: "Cross-check incremental adds against earnings momentum and management commentary." }
  ];
}

function countStatuses(holdings) {
  const c = { New: 0, Increased: 0, Reduced: 0, Unchanged: 0, Exited: 0 };
  for (const h of holdings) c[h.status] = (c[h.status] || 0) + 1;
  return c;
}

function activityLabel(counts) {
  const churn = (counts.New || 0) + (counts.Increased || 0) + (counts.Reduced || 0) + (counts.Exited || 0);
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

const directoryView = document.querySelector("#directory-view");
const profileView = document.querySelector("#profile-view");
const investorGrid = document.querySelector("#investor-grid");
const globalSearchInput = document.querySelector("#global-search");
const selectionSummary = document.querySelector("#selection-summary");
const activeFilterChips = document.querySelector("#active-filter-chips");
const directoryResultsCopy = document.querySelector("#directory-results-copy");
const trackedCount = document.querySelector("#tracked-count");
const holdingsCount = document.querySelector("#holdings-count");
const changeCount = document.querySelector("#change-count");

const filterEls = {
  type: document.querySelector("#type-filter"),
  worth: document.querySelector("#worth-filter"),
  holdings: document.querySelector("#holdings-filter"),
  sector: document.querySelector("#sector-filter"),
  activity: document.querySelector("#activity-filter"),
  sort: document.querySelector("#sort-filter")
};

const profileEls = {
  title: document.querySelector("#profile-title"),
  fund: document.querySelector("#profile-fund"),
  summary: document.querySelector("#profile-summary"),
  portrait: document.querySelector("#profile-portrait"),
  worth: document.querySelector("#profile-worth"),
  worthNote: document.querySelector("#profile-worth-note"),
  metaGrid: document.querySelector("#profile-meta-grid"),
  kpiRow: document.querySelector("#kpi-row"),
  topHoldingsList: document.querySelector("#top-holdings-list"),
  sectorDonut: document.querySelector("#sector-donut"),
  sectorLegend: document.querySelector("#sector-legend"),
  sectorTotalValue: document.querySelector("#sector-total-value"),
  changeTimeline: document.querySelector("#change-timeline"),
  concentrationCard: document.querySelector("#concentration-card"),
  changesGrid: document.querySelector("#changes-grid"),
  watchlistNotes: document.querySelector("#watchlist-notes"),
  sectorBars: document.querySelector("#sector-bars"),
  themeCard: document.querySelector("#theme-card"),
  historyList: document.querySelector("#history-list"),
  notesBody: document.querySelector("#notes-body"),
  holdingsHeadRow: document.querySelector("#holdings-head-row"),
  holdingsBody: document.querySelector("#holdings-body"),
  holdingsSearch: document.querySelector("#holdings-search"),
  holdingsSectorFilter: document.querySelector("#holdings-sector-filter"),
  holdingsStatusFilter: document.querySelector("#holdings-status-filter")
};

const compareDrawer = document.querySelector("#compare-drawer");
const compareList = document.querySelector("#compare-list");
const drawerBackdrop = document.querySelector("#drawer-backdrop");

const state = {
  selectedInvestorId: null,
  compareIds: [],
  directorySearch: "",
  directoryFilters: {
    type: "All Types",
    worth: "All Net Worth",
    holdings: "All Counts",
    sector: "All Sectors",
    activity: "All Activity",
    sort: "Net Worth"
  },
  holdingsSearch: "",
  holdingsSector: "All Sectors",
  holdingsStatus: "All Statuses",
  holdingsSort: {
    key: "valueCr",
    direction: "desc"
  }
};

const directoryOptions = {
  type: ["All Types", "Individual", "Fund"],
  worth: ["All Net Worth", "Above ₹25,000 Cr", "₹10,000 Cr to ₹25,000 Cr", "Below ₹10,000 Cr"],
  holdings: ["All Counts", "10 to 20", "21 to 30", "31+"],
  sector: ["All Sectors"],
  activity: ["All Activity", "High", "Medium", "Low"],
  sort: ["Net Worth", "Latest Activity", "Alphabetically", "Number of Holdings"]
};

const holdingColumns = [
  { key: "index", label: "S. No.", numeric: true },
  { key: "company", label: "Company", numeric: false },
  { key: "sector", label: "Sector", numeric: false },
  { key: "jun25", label: "Jun 2025 %", numeric: true },
  { key: "aug25", label: "Aug 2025 %", numeric: true },
  { key: "sep25", label: "Sep 2025 %", numeric: true },
  { key: "dec25", label: "Dec 2025 %", numeric: true },
  { key: "mar26", label: "Mar 2026 %", numeric: true },
  { key: "valueCr", label: "Current Value", numeric: true },
  { key: "status", label: "Change Status", numeric: false }
];

function currencyCr(value) {
  return `₹${value.toLocaleString("en-IN")} Cr`;
}

function percentage(value) {
  return typeof value === "number" ? `${value.toFixed(2)}%` : '<span class="empty-cell">—</span>';
}

function latestActivityScore(level) {
  return { High: 3, Medium: 2, Low: 1 }[level] ?? 0;
}

function populateDirectoryFilters() {
  Object.entries(directoryOptions).forEach(([key, options]) => {
    filterEls[key].innerHTML = options.map((option) => `<option>${option}</option>`).join("");
    filterEls[key].value = state.directoryFilters[key];
  });
}

function applyDirectoryFilters() {
  let result = investors.filter((investor) => {
    const search = state.directorySearch.toLowerCase();
    const matchesSearch =
      !search ||
      (investor.name || "").toLowerCase().includes(search) ||
      (investor.fund || "").toLowerCase().includes(search) ||
      investor.sectorFocus.join(" ").toLowerCase().includes(search) ||
      investor.holdings.some((holding) => holding.company.toLowerCase().includes(search));

    const matchesType =
      state.directoryFilters.type === "All Types" || investor.type === state.directoryFilters.type;

    const matchesWorth =
      state.directoryFilters.worth === "All Net Worth" ||
      (state.directoryFilters.worth === "Above ₹25,000 Cr" && investor.worthCr > 25000) ||
      (state.directoryFilters.worth === "₹10,000 Cr to ₹25,000 Cr" &&
        investor.worthCr >= 10000 &&
        investor.worthCr <= 25000) ||
      (state.directoryFilters.worth === "Below ₹10,000 Cr" && investor.worthCr < 10000);

    const matchesHoldings =
      state.directoryFilters.holdings === "All Counts" ||
      (state.directoryFilters.holdings === "10 to 20" &&
        investor.holdingsCount >= 10 &&
        investor.holdingsCount <= 20) ||
      (state.directoryFilters.holdings === "21 to 30" &&
        investor.holdingsCount >= 21 &&
        investor.holdingsCount <= 30) ||
      (state.directoryFilters.holdings === "31+" && investor.holdingsCount >= 31);

    const matchesSector =
      state.directoryFilters.sector === "All Sectors" ||
      investor.sectorFocus.includes(state.directoryFilters.sector);

    const matchesActivity =
      state.directoryFilters.activity === "All Activity" ||
      investor.activity === state.directoryFilters.activity;

    return matchesSearch && matchesType && matchesWorth && matchesHoldings && matchesSector && matchesActivity;
  });

  result = result.sort((a, b) => {
    switch (state.directoryFilters.sort) {
      case "Alphabetically":
        return (a.name || a.fund || "").localeCompare(b.name || b.fund || "");
      case "Latest Activity":
        return latestActivityScore(b.activity) - latestActivityScore(a.activity);
      case "Number of Holdings":
        return b.holdingsCount - a.holdingsCount;
      case "Net Worth":
      default:
        return b.worthCr - a.worthCr;
    }
  });

  return result;
}

function directoryCard(investor) {
  const sectors = investor.sectorFocus
    .slice(0, 3)
    .map((sector) => `<span class="sector-chip">${sector}</span>`)
    .join("");

  return `
    <article class="investor-card ${state.selectedInvestorId === investor.id ? "is-selected" : ""}" data-id="${investor.id}">
      <div class="investor-card__top">
        <div class="portrait-ring" data-initials="${investor.initials}" aria-hidden="true"></div>
        <div class="investor-card__meta">
          <h3 class="investor-card__name">${investor.name || investor.fund}</h3>
          <strong>${investor.name && investor.fund ? investor.fund : ""}</strong>
          <p class="investor-card__summary">${investor.description}</p>
        </div>
      </div>

      <div class="investor-card__stats">
        <div class="stat-block">
          <span>Total Portfolio</span>
          <strong>${currencyCr(investor.worthCr)}</strong>
        </div>
        <div class="stat-block">
          <span>Active Holdings</span>
          <strong>${investor.holdingsCount}</strong>
        </div>
      </div>

      <div class="chip-row">${sectors}</div>

      <div class="card-footer">
        <span class="subdued-copy">${investor.activity} portfolio change activity</span>
        <button class="primary-button investor-open" type="button" data-id="${investor.id}">
          View Profile
        </button>
      </div>
    </article>
  `;
}

function updateDirectoryStats(filteredInvestors) {
  trackedCount.textContent = String(investors.length).padStart(2, "0");
  holdingsCount.textContent = String(
    investors.reduce((sum, investor) => sum + investor.holdingsCount, 0)
  ).padStart(2, "0");
  changeCount.textContent = String(
    investors.reduce(
      (sum, investor) =>
        sum + investor.holdings.filter((holding) => ["New", "Increased", "Reduced"].includes(holding.status)).length,
      0
    )
  ).padStart(2, "0");

  directoryResultsCopy.textContent = `${filteredInvestors.length} investor${filteredInvestors.length === 1 ? "" : "s"} match the current screen.`;
}

function renderActiveFilterChips(filteredInvestors) {
  const active = [];

  if (state.directorySearch) active.push(`Search: ${state.directorySearch}`);
  Object.entries(state.directoryFilters).forEach(([key, value]) => {
    const defaultValue = {
      type: "All Types",
      worth: "All Net Worth",
      holdings: "All Counts",
      sector: "All Sectors",
      activity: "All Activity",
      sort: "Net Worth"
    }[key];

    if (value !== defaultValue) active.push(value);
  });

  if (!filteredInvestors.length) active.push("No investors found");

  activeFilterChips.innerHTML = active.map((chip) => `<span class="filter-chip">${chip}</span>`).join("");
}

function renderSelectionSummary() {
  const investor = investors.find((item) => item.id === state.selectedInvestorId);

  if (!investor) {
    selectionSummary.innerHTML = `
      <strong>No investor selected</strong>
      <p>Choose a card to pin it, then open the profile workspace.</p>
    `;
    return;
  }

  selectionSummary.innerHTML = `
    <strong>${investor.name || investor.fund}</strong>
    <p>${investor.name && investor.fund ? investor.fund : ""}</p>
    <p>${currencyCr(investor.worthCr)} across ${investor.holdingsCount} active holdings.</p>
  `;
}

function renderDirectory() {
  const filteredInvestors = applyDirectoryFilters();
  updateDirectoryStats(filteredInvestors);
  renderActiveFilterChips(filteredInvestors);
  renderSelectionSummary();

  if (!filteredInvestors.length) {
    investorGrid.innerHTML = `
      <article class="panel">
        <p class="panel-kicker">No Results</p>
        <h2>No investors match the current screen.</h2>
        <p class="page-subtitle">Relax one or more filters to broaden the directory view.</p>
      </article>
    `;
    return;
  }

  investorGrid.innerHTML = filteredInvestors.map(directoryCard).join("");

  investorGrid.querySelectorAll(".investor-card").forEach((card) => {
    const { id } = card.dataset;
    card.addEventListener("click", (event) => {
      if (event.target.closest(".investor-open")) return;
      state.selectedInvestorId = id;
      renderDirectory();
    });
  });

  investorGrid.querySelectorAll(".investor-open").forEach((button) => {
    button.addEventListener("click", (event) => {
      state.selectedInvestorId = event.currentTarget.dataset.id;
      openProfileView();
    });
  });
}

function statusBadge(status) {
  const tone = status.toLowerCase().replace(/\s+/g, "-");
  return `<span class="status-badge status-badge--${tone}">${status}</span>`;
}

function populateHoldingsFilters(investor) {
  const sectors = ["All Sectors", ...new Set(investor.holdings.map((holding) => holding.sector))];
  const statuses = ["All Statuses", ...new Set(investor.holdings.map((holding) => holding.status))];

  profileEls.holdingsSectorFilter.innerHTML = sectors.map((sector) => `<option>${sector}</option>`).join("");
  profileEls.holdingsStatusFilter.innerHTML = statuses.map((status) => `<option>${status}</option>`).join("");

  if (!sectors.includes(state.holdingsSector)) state.holdingsSector = "All Sectors";
  if (!statuses.includes(state.holdingsStatus)) state.holdingsStatus = "All Statuses";

  profileEls.holdingsSectorFilter.value = state.holdingsSector;
  profileEls.holdingsStatusFilter.value = state.holdingsStatus;
}

function buildDonutGradient(allocation) {
  let running = 0;
  const stops = allocation.map((item) => {
    const start = running;
    running += item.value;
    return `${item.color} ${start}% ${running}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function renderProfile(investorId) {
  const investor = investors.find((item) => item.id === investorId) ?? investors[0];
  if (!investor) return;
  state.selectedInvestorId = investor.id;

  profileEls.title.textContent = investor.name || investor.fund;
  profileEls.fund.textContent = investor.name && investor.fund ? investor.fund : "";
  profileEls.summary.textContent = investor.bio;
  profileEls.portrait.dataset.initials = investor.initials;
  profileEls.worth.textContent = currencyCr(investor.worthCr);
  profileEls.worthNote.textContent = "Latest disclosed portfolio value";

  profileEls.metaGrid.innerHTML = [
    ["Active Since", investor.activeSince],
    ["Investor Style", investor.style],
    ["Holdings", String(investor.holdingsCount)],
    ["Concentration", investor.concentration],
    ["Key Sectors", investor.keySectors]
  ]
    .map(
      ([label, value]) => `
        <div class="meta-item">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `
    )
    .join("");

  profileEls.kpiRow.innerHTML = investor.kpis
    .map(
      (item) => `
        <article class="kpi-tile">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
          <small>${item.note}</small>
        </article>
      `
    )
    .join("");

  profileEls.topHoldingsList.innerHTML = investor.topHoldings
    .map(
      (holding) => `
        <div class="mini-list__item">
          <div>
            <div class="mini-list__name">${holding.company}</div>
            <div class="mini-list__sub">${holding.sector}</div>
          </div>
          <div class="mini-list__value">${holding.value}</div>
        </div>
      `
    )
    .join("");

  profileEls.sectorDonut.style.background = buildDonutGradient(investor.sectorAllocation);
  profileEls.sectorLegend.innerHTML = investor.sectorAllocation
    .map(
      (item) => `
        <div class="legend-item">
          <span class="legend-dot" style="background:${item.color}"></span>
          <div>
            <strong>${item.sector}</strong>
            <div class="mini-list__sub">${item.amount}</div>
          </div>
          <strong>${item.value}%</strong>
        </div>
      `
    )
    .join("");
  profileEls.sectorTotalValue.textContent = currencyCr(investor.worthCr);

  profileEls.changeTimeline.innerHTML = investor.timeline
    .map(
      (entry) => `
        <div class="timeline-entry">
          <small>${entry.date}</small>
          <strong>${entry.title}</strong>
          <p>${entry.body}</p>
        </div>
      `
    )
    .join("");

  profileEls.concentrationCard.innerHTML = `
    <strong>${investor.concentrationSummary.title}</strong>
    <p>${investor.concentrationSummary.body}</p>
    <div class="progress-row">
      <div class="mini-list__label">Top 5 Holdings</div>
      <div class="progress-bar"><span style="width:${investor.concentrationSummary.topFive}%"></span></div>
      <div class="mini-list__sub">${investor.concentrationSummary.topFive}% of total value</div>
    </div>
    <div class="progress-row">
      <div class="mini-list__label">Top 10 Holdings</div>
      <div class="progress-bar"><span style="width:${investor.concentrationSummary.topTen}%"></span></div>
      <div class="mini-list__sub">${investor.concentrationSummary.topTen}% of total value</div>
    </div>
  `;

  const leadingChanges = investor.holdings
    .filter((holding) => holding.status !== "Unchanged")
    .slice(0, 6);

  profileEls.changesGrid.innerHTML = leadingChanges
    .map(
      (holding) => `
        <article class="change-card">
          ${statusBadge(holding.status)}
          <h3>${holding.company}</h3>
          <p>${holding.sector} • ${holding.mar26 ? `${holding.mar26.toFixed(2)}% in Mar 2026` : "Position inactive"}</p>
          <strong>${currencyCr(holding.valueCr)}</strong>
        </article>
      `
    )
    .join("");

  profileEls.watchlistNotes.innerHTML = investor.notes
    .map(
      (note) => `
        <article class="note-item">
          <strong>${note.title}</strong>
          <p>${note.body}</p>
        </article>
      `
    )
    .join("");

  profileEls.sectorBars.innerHTML = investor.sectorAllocation
    .map(
      (item) => `
        <div class="bar-row">
          <strong>${item.sector}</strong>
          <div class="bar-track"><span style="width:${item.value}%"></span></div>
          <span>${item.value}%</span>
        </div>
      `
    )
    .join("");

  profileEls.themeCard.innerHTML = `
    <strong>${investor.themeSummary.title}</strong>
    <p>${investor.themeSummary.body}</p>
    <div class="chip-row">
      ${investor.sectorFocus.map((sector) => `<span class="sector-chip">${sector}</span>`).join("")}
    </div>
  `;

  profileEls.historyList.innerHTML = investor.timeline
    .concat(
      investor.holdings
        .filter((holding) => holding.status === "Unchanged")
        .slice(0, 2)
        .map((holding, index) => ({
          date: index === 0 ? "28 Feb 2026" : "31 Jan 2026",
          title: `Maintained ${holding.company}`,
          body: `No quarter-on-quarter change in disclosed ownership for ${holding.company}.`
        }))
    )
    .map(
      (entry) => `
        <article class="history-entry">
          <small>${entry.date}</small>
          <strong>${entry.title}</strong>
          <p>${entry.body}</p>
        </article>
      `
    )
    .join("");

  profileEls.notesBody.innerHTML = investor.notes
    .map(
      (note) => `
        <article class="note-item">
          <strong>${note.title}</strong>
          <p>${note.body}</p>
        </article>
      `
    )
    .join("");

  populateHoldingsFilters(investor);
  renderHoldingsTable(investor);
  renderDirectory();
  renderCompareDrawer();
}

function compareValue(left, right, key) {
  if (key === "company" || key === "sector" || key === "status") {
    return String(left[key]).localeCompare(String(right[key]));
  }

  if (key === "index") return 0;
  return (left[key] ?? -Infinity) - (right[key] ?? -Infinity);
}

function renderHoldingsHeaders() {
  profileEls.holdingsHeadRow.innerHTML = holdingColumns
    .map((column) => {
      const active = state.holdingsSort.key === column.key;
      const direction = active && state.holdingsSort.direction === "asc" ? "↑" : "↓";

      if (column.key === "index") {
        return `<th class="${column.numeric ? "is-numeric" : ""}">${column.label}</th>`;
      }

      return `
        <th class="${column.numeric ? "is-numeric" : ""}">
          <button class="sortable-header" type="button" data-sort-key="${column.key}">
            ${column.label}
            <span class="sort-indicator ${active ? "is-active" : ""}" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 6v12M12 6l-4 4M12 6l4 4" transform="${direction === "↓" ? "rotate(180 12 12)" : ""}" />
              </svg>
            </span>
          </button>
        </th>
      `;
    })
    .join("");

  profileEls.holdingsHeadRow.querySelectorAll("[data-sort-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const { sortKey } = button.dataset;
      if (state.holdingsSort.key === sortKey) {
        state.holdingsSort.direction = state.holdingsSort.direction === "asc" ? "desc" : "asc";
      } else {
        state.holdingsSort.key = sortKey;
        state.holdingsSort.direction = sortKey === "company" || sortKey === "sector" || sortKey === "status" ? "asc" : "desc";
      }
      renderProfile(state.selectedInvestorId);
    });
  });
}

function renderHoldingsTable(investor) {
  renderHoldingsHeaders();

  const search = state.holdingsSearch.toLowerCase();
  const rows = investor.holdings
    .filter((holding) => {
      const matchesSearch =
        !search ||
        holding.company.toLowerCase().includes(search) ||
        holding.sector.toLowerCase().includes(search) ||
        holding.status.toLowerCase().includes(search);
      const matchesSector =
        state.holdingsSector === "All Sectors" || holding.sector === state.holdingsSector;
      const matchesStatus =
        state.holdingsStatus === "All Statuses" || holding.status === state.holdingsStatus;
      return matchesSearch && matchesSector && matchesStatus;
    })
    .sort((left, right) => {
      const diff = compareValue(left, right, state.holdingsSort.key);
      return state.holdingsSort.direction === "asc" ? diff : -diff;
    });

  profileEls.holdingsBody.innerHTML = rows
    .map(
      (holding, index) => `
        <tr>
          <td class="is-numeric">${index + 1}</td>
          <td><a class="company-link" href="#">${holding.company}</a></td>
          <td>${holding.sector}</td>
          <td class="is-numeric">${percentage(holding.jun25)}</td>
          <td class="is-numeric">${percentage(holding.aug25)}</td>
          <td class="is-numeric">${percentage(holding.sep25)}</td>
          <td class="is-numeric">${percentage(holding.dec25)}</td>
          <td class="is-numeric">${percentage(holding.mar26)}</td>
          <td class="is-numeric">${holding.valueCr ? currencyCr(holding.valueCr) : '<span class="empty-cell">—</span>'}</td>
          <td>${statusBadge(holding.status)}</td>
        </tr>
      `
    )
    .join("");

  if (!rows.length) {
    profileEls.holdingsBody.innerHTML = `
      <tr>
        <td colspan="10">
          <div class="change-card">
            <strong>No holdings match the current screen.</strong>
            <p>Broaden the search or relax one of the table filters.</p>
          </div>
        </td>
      </tr>
    `;
  }
}

function openProfileView() {
  directoryView.classList.remove("is-active");
  profileView.classList.add("is-active");
  activateTab("overview-panel");
  syncGlobalSearch();
  renderProfile(state.selectedInvestorId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openDirectoryView() {
  profileView.classList.remove("is-active");
  directoryView.classList.add("is-active");
  syncGlobalSearch();
  renderDirectory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleCompareDrawer(forceState) {
  const shouldOpen = typeof forceState === "boolean" ? forceState : !compareDrawer.classList.contains("is-open");
  compareDrawer.classList.toggle("is-open", shouldOpen);
  compareDrawer.setAttribute("aria-hidden", String(!shouldOpen));
  drawerBackdrop.hidden = !shouldOpen;
}

function renderCompareDrawer() {
  const items = state.compareIds
    .map((id) => investors.find((investor) => investor.id === id))
    .filter(Boolean);

  compareList.innerHTML = items
    .map(
      (investor) => `
        <article class="compare-item">
          <div class="compare-item__top">
            <div class="portrait-ring" data-initials="${investor.initials}" aria-hidden="true"></div>
            <div>
              <strong>${investor.name || investor.fund}</strong>
              <div class="mini-list__sub">${investor.name && investor.fund ? investor.fund : ""}</div>
            </div>
            <button class="text-button compare-remove" type="button" data-id="${investor.id}">Remove</button>
          </div>
          <div class="compare-item__metrics">
            <div class="compare-metric">
              <span class="mini-list__label">Portfolio</span>
              <strong>${currencyCr(investor.worthCr)}</strong>
            </div>
            <div class="compare-metric">
              <span class="mini-list__label">Holdings</span>
              <strong>${investor.holdingsCount}</strong>
            </div>
            <div class="compare-metric">
              <span class="mini-list__label">Activity</span>
              <strong>${investor.activity}</strong>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  compareList.querySelectorAll(".compare-remove").forEach((button) => {
    button.addEventListener("click", () => {
      state.compareIds = state.compareIds.filter((id) => id !== button.dataset.id);
      renderCompareDrawer();
    });
  });
}

function setupTabs() {
  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
  });
}

function activateTab(target) {
  document.querySelectorAll("[data-tab-target]").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tabTarget === target);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === target);
  });
}

function syncGlobalSearch() {
  const isDirectory = directoryView.classList.contains("is-active");
  globalSearchInput.value = isDirectory ? state.directorySearch : state.holdingsSearch;
  globalSearchInput.placeholder = isDirectory
    ? "Search investor, fund, sector, or company"
    : "Search holdings, sectors, or status";
}

function attachGlobalEvents() {
  Object.keys(filterEls).forEach((key) => {
    filterEls[key].addEventListener("change", () => {
      state.directoryFilters[key] = filterEls[key].value;
      renderDirectory();
    });
  });

  globalSearchInput.addEventListener("input", (event) => {
    if (directoryView.classList.contains("is-active")) {
      state.directorySearch = event.target.value.trim();
      renderDirectory();
    } else {
      state.holdingsSearch = event.target.value.trim();
      profileEls.holdingsSearch.value = state.holdingsSearch;
      renderProfile(state.selectedInvestorId);
    }
  });

  profileEls.holdingsSearch.addEventListener("input", (event) => {
    state.holdingsSearch = event.target.value.trim();
    renderProfile(state.selectedInvestorId);
  });

  profileEls.holdingsSectorFilter.addEventListener("change", (event) => {
    state.holdingsSector = event.target.value;
    renderProfile(state.selectedInvestorId);
  });

  profileEls.holdingsStatusFilter.addEventListener("change", (event) => {
    state.holdingsStatus = event.target.value;
    renderProfile(state.selectedInvestorId);
  });

  document.querySelector("#back-to-directory").addEventListener("click", openDirectoryView);
  document.querySelector("#home-brand").addEventListener("click", openDirectoryView);

  document.querySelector("#reset-directory-filters").addEventListener("click", () => {
    state.directoryFilters = {
      type: "All Types",
      worth: "All Net Worth",
      holdings: "All Counts",
      sector: "All Sectors",
      activity: "All Activity",
      sort: "Net Worth"
    };
    state.directorySearch = "";
    populateDirectoryFilters();
    syncGlobalSearch();
    renderDirectory();
  });

  document.querySelector("#compare-button").addEventListener("click", () => toggleCompareDrawer(true));
  document.querySelector("#profile-compare").addEventListener("click", () => {
    if (!state.compareIds.includes(state.selectedInvestorId)) {
      state.compareIds = [...state.compareIds, state.selectedInvestorId].slice(-4);
    }
    renderCompareDrawer();
    toggleCompareDrawer(true);
  });
  document.querySelector("#close-compare").addEventListener("click", () => toggleCompareDrawer(false));
  drawerBackdrop.addEventListener("click", () => toggleCompareDrawer(false));
}

// ========== MUNS AGENTS MODULE ==========

const MUNS_API_BASE = "https://devde.muns.io";
const MUNS_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZWE5ZGMyYi0xZDBmLTQ2MzctOGE2Ny0wM2VhNzFmMGYyY2YiLCJlbWFpbCI6Im5hZGFtc2FsdWphQGdtYWlsLmNvbSIsIm9yZ0lkIjoiMSIsImF1dGhvcml0eSI6InVzZXIiLCJpYXQiOjE3NzY2NzkyMzgsImV4cCI6MTc3NzExMTIzOH0.DjD6IxGL5EJ4mWeXO8bj8vpBNx0RaipmzBqDDbfqEdg";

const agentsState = {
  agents: [],
  activeAgentId: null,
  sessions: {},
};

const agentEls = {
  button: document.querySelector("#agents-button"),
  view: document.querySelector("#agents-view"),
  backBtn: document.querySelector("#back-from-agents"),
  tabstrip: document.querySelector("#agents-tabstrip"),
  tabstripPanel: document.querySelector(".agents-tabstrip-panel"),
  activeTitle: document.querySelector("#agents-active-title"),
  runPanel: document.querySelector("#agents-run-panel"),
  runName: document.querySelector("#agents-run-name"),
  runId: document.querySelector("#agents-run-id"),
  runButton: document.querySelector("#agents-run-button"),
  queryToggle: document.querySelector("#agents-query-toggle"),
  queryBlock: document.querySelector("#agents-query-block"),
  queryInput: document.querySelector("#agents-query-input"),
  tickerInput: document.querySelector("#agents-ticker-input"),
  companyInput: document.querySelector("#agents-company-input"),
  contextChips: document.querySelector("#agents-context-chips"),
  output: document.querySelector("#agents-output"),
  idsDiv: document.querySelector("#agents-ids"),
  addAgentBtn: document.querySelector("#add-agent-button"),
  modal: document.querySelector("#add-agent-modal"),
  form: document.querySelector("#add-agent-form"),
  formId: document.querySelector("#add-agent-id"),
  formName: document.querySelector("#add-agent-name"),
  formLibraryId: document.querySelector("#add-agent-library-id"),
  formError: document.querySelector("#add-agent-error"),
  tokenToggle: document.querySelector("#agents-token-toggle"),
  tokenRow: document.querySelector("#agents-token-row"),
  tokenInput: document.querySelector("#agents-token-input"),
  tokenSave: document.querySelector("#agents-token-save"),
  tokenClear: document.querySelector("#agents-token-clear"),
  tokenStatus: document.querySelector("#agents-token-status"),
};

const AGENTS_STORAGE_KEY = "muns_agents_v2";
const AGENT_SESSIONS_KEY = "muns_agent_sessions_v2";
const AGENT_TOKEN_KEY = "muns_agent_token_override_v1";

function getMunsToken() {
  try {
    const override = (localStorage.getItem(AGENT_TOKEN_KEY) || "").trim();
    if (override) return override;
  } catch {
    /* ignore */
  }
  return MUNS_ACCESS_TOKEN;
}

function setMunsTokenOverride(value) {
  const trimmed = (value || "").trim();
  if (trimmed) {
    localStorage.setItem(AGENT_TOKEN_KEY, trimmed);
  } else {
    localStorage.removeItem(AGENT_TOKEN_KEY);
  }
}

function renderAgentsTokenStatus() {
  let override = "";
  try {
    override = (localStorage.getItem(AGENT_TOKEN_KEY) || "").trim();
  } catch {
    /* ignore */
  }
  if (override) {
    const tail = override.slice(-8);
    agentEls.tokenStatus.textContent = `Using session override (…${tail}).`;
    agentEls.tokenStatus.dataset.state = "override";
  } else {
    agentEls.tokenStatus.textContent = "Using built-in token.";
    agentEls.tokenStatus.dataset.state = "default";
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function loadAgents() {
  const stored = localStorage.getItem(AGENTS_STORAGE_KEY);
  agentsState.agents = stored ? JSON.parse(stored) : [];
}

function saveAgents() {
  localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agentsState.agents));
}

function loadAgentSessions() {
  try {
    const stored = sessionStorage.getItem(AGENT_SESSIONS_KEY);
    agentsState.sessions = stored ? JSON.parse(stored) : {};
  } catch {
    agentsState.sessions = {};
  }
}

function saveAgentSessions() {
  try {
    sessionStorage.setItem(AGENT_SESSIONS_KEY, JSON.stringify(agentsState.sessions));
  } catch {
    /* sessionStorage quota or disabled; ignore */
  }
}

// ---------- Output cleaning ----------

const NOISE_RE = /^(WriteTodos|NewsSearch|WebSearch|WebReader|DocumentFetch|PythonRepl|GetAnnouncements|HTTP\/\d|server:|date:|content-type:|x-powered-by:|access-control|x-request-id:|x-ratelimit|cache-control:|x-active-analyst-id:|x-analyst-output-id:|access-control-expose)/i;
const BASE64_NOISE_RE = /^H4sI[A-Za-z0-9+/=]+$|H4sI[A-Za-z0-9+/=]{120,}|^[A-Za-z0-9+/]{200,}={0,2}$/;

function cleanStreamToMarkdown(raw) {
  const withoutGraphs = raw.replace(/<graph[^>]*>[\s\S]*?<\/graph>/gi, "");
  const withoutDocSources = withoutGraphs.replace(/<doc_source>\d+<\/doc_source>/g, "");
  return withoutDocSources
    .split("\n")
    .map((line) => line.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .filter((line) => !NOISE_RE.test(line))
    .filter((line) => !BASE64_NOISE_RE.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------- Output rendering ----------

function renderAgentMarkdown(md) {
  const blocks = parseAgentOutput(md);
  const holdings = blocks.filter(isHoldingsBlock);
  if (holdings.length === 0) {
    return `<div class="agents-markdown"><p class="agents-output-empty">No holdings tables found in this output.</p></div>`;
  }
  const sections = holdings
    .map(
      (b) =>
        `<section class="agents-block"><h3>${escapeHtml(b.heading)}</h3>${renderDataTable(b.table)}</section>`,
    )
    .join("");
  return `<div class="agents-markdown">${sections}</div>`;
}

function isHoldingsBlock(block) {
  if (!block.table) return false;
  const heading = (block.heading || "").toLowerCase();
  const cols = block.table.columns.map((c) => c.toLowerCase());

  if (/holding|portfolio|position|scrip/.test(heading)) return true;

  const hasEntity = cols.some((c) =>
    /\b(company|stock|ticker|symbol|security|scrip|instrument|name)\b/.test(c),
  );
  const hasPeriod = cols.some(
    (c) =>
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|quarter|fy)\b/.test(c) ||
      /%|\bpct\b|percent/.test(c) ||
      /\b(19|20)\d{2}\b/.test(c),
  );
  const hasValue = cols.some((c) => /value|worth|cr\.?|crore|₹|rs\.?|inr|usd|\$/.test(c));

  return hasEntity && (hasPeriod || hasValue);
}

function parseAgentOutput(raw) {
  const sections = raw
    .split(/(?=^#{1,4}\s)/m)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sections.length === 0 && raw.trim()) {
    return [{ heading: "Overview", type: "unknown", prose: raw, items: [], table: null }];
  }
  return sections.map((section) => {
    const headingMatch = section.match(/^#{1,4}\s+(.+)$/m);
    const heading = headingMatch ? headingMatch[1].trim() : "Overview";
    const body = section.replace(/^#{1,4}\s+.+$/m, "").trim();

    const tableMatch = body.match(/(\|.+\|[ \t]*\n\|[ \t|:\-]+\|[ \t]*\n(?:\|.+\|[ \t]*\n?)+)/);
    const table = tableMatch ? parseMdTable(tableMatch[0]) : null;
    const prose = tableMatch ? body.replace(tableMatch[0], "").trim() : body;

    const items = [];
    const boldBulletRe = /^[\*\-]\s+\*\*(.+?)\*\*[:\s]*(.*)/gm;
    let m;
    while ((m = boldBulletRe.exec(body)) !== null) {
      items.push(m[2] ? `${m[1]}: ${m[2]}` : m[1]);
    }
    if (items.length === 0) {
      const plainBulletRe = /^[\*\-]\s+(.+)$/gm;
      while ((m = plainBulletRe.exec(body)) !== null) {
        items.push(m[1].replace(/\*\*/g, "").trim());
      }
    }

    const type = classifyAgentBlock(heading, table ? table.columns : []);
    return { heading, type, prose, items, table };
  });
}

function parseMdTable(raw) {
  const lines = raw.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;
  const parseCells = (line) => line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  if (!/^\|?[\s|\-:]+\|?$/.test(lines[1]) || !lines[1].includes("-")) return null;
  const columns = parseCells(lines[0]).map((c) => c.replace(/\*\*/g, "").trim());
  const rows = lines.slice(2).map((line) => {
    const cells = parseCells(line);
    const row = {};
    columns.forEach((c, i) => {
      row[c] = (cells[i] || "").replace(/\*\*/g, "").trim();
    });
    return row;
  });
  return { columns, rows };
}

function classifyAgentBlock(heading, columns) {
  const h = heading.toLowerCase();
  const cols = columns.map((c) => c.toLowerCase());
  const has = (n) => cols.some((c) => c.includes(n));
  if (/executive\s+summary|overview|background/.test(h)) return "executive_summary";
  if (/key\s+finding|highlight|insight/.test(h)) return "key_findings";
  if (/recommendation|action|next\s+step|takeaway/.test(h)) return "recommendations";
  if (/ceo\s+detail|ceo\s+profile|chief\s+executive/.test(h)) return "ceo_details";
  if (/timeline|announcement|recent\s+update/.test(h)) return "timeline_table";
  if (/management\s+summary|management\s+overview/.test(h)) return "kv_table";
  if (has("status")) return "status_table";
  if (has("date") && (has("event") || has("update") || has("announcement"))) return "timeline_table";
  if (has("field") && has("value")) return "kv_table";
  return columns.length > 0 ? "data_table" : "unknown";
}

function statusClassFor(value) {
  const v = (value || "").trim().toLowerCase();
  if (["positive", "pass", "yes", "good", "experienced", "sufficient", "new", "increased"].includes(v)) return "status-badge--increased";
  if (["negative", "fail", "no", "poor", "not experienced", "reduced", "exited"].includes(v)) return "status-badge--reduced";
  if (["warning", "above average"].includes(v)) return "status-badge--filing-due";
  return "status-badge--unchanged";
}

function renderAgentBlock(block) {
  let inner = "";
  if (block.type === "key_findings" && block.items.length) {
    inner = `<ul>${block.items.map((i) => `<li>${mdInline(i)}</li>`).join("")}</ul>`;
  } else if (block.type === "recommendations" && block.items.length) {
    inner = `<ol>${block.items.map((i) => `<li>${mdInline(i)}</li>`).join("")}</ol>`;
  } else if (block.type === "kv_table" && block.table) {
    inner = renderKvGrid(block.table);
    if (block.prose) inner += mdToHtml(block.prose);
  } else if (block.type === "timeline_table" && block.table) {
    inner = renderTimeline(block.table);
    if (block.prose) inner += mdToHtml(block.prose);
  } else if (block.type === "ceo_details" && block.table) {
    inner = renderPersonCard(block.table);
    if (block.prose) inner += mdToHtml(block.prose);
  } else if (block.table) {
    inner = renderDataTable(block.table);
    if (block.prose) inner += mdToHtml(block.prose);
  } else if (block.prose) {
    inner = mdToHtml(block.prose);
  } else if (block.items.length) {
    inner = `<ul>${block.items.map((i) => `<li>${mdInline(i)}</li>`).join("")}</ul>`;
  }
  return `<section class="agents-block"><h3>${escapeHtml(block.heading)}</h3>${inner}</section>`;
}

function renderDataTable(table) {
  const statusCol = table.columns.find((c) => c.toLowerCase().includes("status"));
  const head = table.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = table.rows
    .map((row) => {
      const cells = table.columns
        .map((c) => {
          const value = row[c] || "";
          if (statusCol && c === statusCol && value) {
            return `<td><span class="status-badge ${statusClassFor(value)}">${escapeHtml(value)}</span></td>`;
          }
          return `<td>${escapeHtml(value)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderKvGrid(table) {
  if (table.columns.length < 2 || table.rows.length === 0) return renderDataTable(table);
  const [keyCol, valCol] = table.columns;
  const cards = table.rows
    .map((row) => {
      const key = (row[keyCol] || "").trim();
      const val = (row[valCol] || "").trim();
      if (!key && !val) return "";
      const statusCls = statusClassFor(val);
      const isStatus = statusCls !== "status-badge--unchanged";
      const valueHtml = isStatus
        ? `<span class="status-badge ${statusCls}">${escapeHtml(val || "-")}</span>`
        : `<p class="agents-kv-value">${escapeHtml(val || "-")}</p>`;
      return `<div class="agents-kv-card"><p class="agents-kv-key">${escapeHtml(key || "Value")}</p>${valueHtml}</div>`;
    })
    .join("");
  return `<div class="agents-kv-grid">${cards}</div>`;
}

function renderTimeline(table) {
  const findCol = (...needles) =>
    table.columns.find((c) => needles.some((n) => c.toLowerCase().includes(n)));
  const dateCol = findCol("date", "time", "updated", "timestamp");
  const titleCol = findCol("event", "update", "announcement", "headline", "item");
  const detailCol = findCol("description", "detail", "notes", "summary", "comment");
  if (!dateCol && !titleCol && !detailCol) return renderDataTable(table);
  const items = table.rows
    .map((row) => ({
      date: (dateCol && row[dateCol]) || "",
      title: (titleCol && row[titleCol]) || "",
      detail: (detailCol && row[detailCol]) || "",
    }))
    .filter((i) => i.date || i.title || i.detail);
  if (items.length === 0) return renderDataTable(table);
  return `<div class="agents-timeline">${items
    .map(
      (i) => `
    <div class="agents-timeline__item">
      <div class="agents-timeline__dot"></div>
      <div class="agents-timeline__card">
        <div class="agents-timeline__head">
          ${i.title ? `<strong>${escapeHtml(i.title)}</strong>` : ""}
          ${i.date ? `<span class="agents-timeline__date">${escapeHtml(i.date)}</span>` : ""}
        </div>
        ${i.detail ? `<p>${escapeHtml(i.detail)}</p>` : ""}
      </div>
    </div>`,
    )
    .join("")}</div>`;
}

function renderPersonCard(table) {
  const row = table.rows[0];
  if (!row) return "";
  const findCol = (...needles) =>
    table.columns.find((c) => needles.some((n) => c.toLowerCase().includes(n)));
  const name = row[findCol("name") || ""] || "";
  const role = row[findCol("role", "position", "title") || ""] || "";
  const age = row[findCol("age") || ""] || "";
  const tenure = row[findCol("tenure") || ""] || "";
  const comp = row[findCol("compensation", "salary", "pay", "total") || ""] || "";
  const notes = row[findCol("notes", "detail", "description") || ""] || "";
  if (!name && !role && !age && !tenure && !comp && !notes) return renderDataTable(table);
  return `
    <div class="agents-person">
      ${name ? `<strong class="agents-person__name">${escapeHtml(name)}</strong>` : ""}
      ${role ? `<p class="agents-person__role">${escapeHtml(role)}</p>` : ""}
      <div class="agents-person__meta">
        ${age ? `<div><span>Age</span><strong>${escapeHtml(age)}</strong></div>` : ""}
        ${tenure ? `<div><span>Tenure</span><strong>${escapeHtml(tenure)}</strong></div>` : ""}
        ${comp ? `<div><span>Compensation</span><strong>${escapeHtml(comp)}</strong></div>` : ""}
      </div>
      ${notes ? `<p class="agents-person__notes">${escapeHtml(notes)}</p>` : ""}
    </div>`;
}

function mdInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function mdToHtml(text) {
  if (!text) return "";
  const lines = text.split("\n");
  const out = [];
  let paragraph = [];
  let list = null;
  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${mdInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`<${list.tag}>${list.items.map((i) => `<li>${mdInline(i)}</li>`).join("")}</${list.tag}>`);
      list = null;
    }
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 2, 6);
      out.push(`<h${level}>${mdInline(heading[2])}</h${level}>`);
      continue;
    }
    const bullet = line.match(/^[\*\-]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      if (!list || list.tag !== "ul") {
        flushList();
        list = { tag: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      if (!list || list.tag !== "ol") {
        flushList();
        list = { tag: "ol", items: [] };
      }
      list.items.push(numbered[1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return out.join("");
}

function getSessionKey(agentId) {
  const investorId = state.selectedInvestorId || "default";
  return `${agentId}::${investorId}`;
}

function getAgentSession(agentId) {
  const key = getSessionKey(agentId);
  if (!agentsState.sessions[key]) {
    agentsState.sessions[key] = {
      markdown: "",
      error: null,
      userQuery: "",
      queryOpen: false,
      inputTicker: "",
      inputCompanyName: "",
      activeAnalystId: null,
      analystOutputId: null,
    };
  }
  return agentsState.sessions[key];
}

function patchAgentSession(agentId, patch) {
  const key = getSessionKey(agentId);
  const sess = getAgentSession(agentId);
  agentsState.sessions[key] = { ...sess, ...patch };
  saveAgentSessions();
}

function openAgentsView() {
  directoryView.classList.remove("is-active");
  profileView.classList.remove("is-active");
  agentEls.view.classList.add("is-active");
  if (!agentsState.activeAgentId && agentsState.agents.length > 0) {
    agentsState.activeAgentId = agentsState.agents[0].id;
  }
  renderAgentsTabs();
  renderAgentsTokenStatus();
  if (agentsState.activeAgentId) {
    renderAgentPanel(agentsState.activeAgentId);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeAgentsView() {
  agentEls.view.classList.remove("is-active");
  openDirectoryView();
}

function renderAgentsTabs() {
  if (agentsState.agents.length === 0) {
    agentEls.tabstrip.innerHTML = "<p style='text-align: center; color: var(--text-muted); padding: 20px;'>No agent tabs yet. Add one to begin.</p>";
    agentEls.activeTitle.textContent = "No agent selected";
    agentEls.runPanel.hidden = true;
    return;
  }

  agentEls.tabstrip.innerHTML = agentsState.agents
    .map((agent) => {
      const isActive = agent.id === agentsState.activeAgentId;
      return `
        <div class="agents-tab-item">
          <button
            class="tab-chip ${isActive ? "is-active" : ""}"
            type="button"
            data-agent-id="${agent.id}"
          >
            ${agent.name}
          </button>
          <button
            class="agents-tab-remove"
            type="button"
            aria-label="Remove ${agent.name}"
            data-agent-id="${agent.id}"
          >
            ✕
          </button>
        </div>
      `;
    })
    .join("");

  agentEls.tabstrip.querySelectorAll(".tab-chip[data-agent-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      agentsState.activeAgentId = btn.dataset.agentId;
      renderAgentsTabs();
      renderAgentPanel(agentsState.activeAgentId);
    });
  });

  agentEls.tabstrip.querySelectorAll(".agents-tab-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const agentId = btn.dataset.agentId;
      agentsState.agents = agentsState.agents.filter((a) => a.id !== agentId);
      if (agentsState.activeAgentId === agentId) {
        agentsState.activeAgentId = agentsState.agents[0]?.id || null;
      }
      saveAgents();
      renderAgentsTabs();
      if (agentsState.activeAgentId) {
        renderAgentPanel(agentsState.activeAgentId);
      } else {
        agentEls.runPanel.hidden = true;
      }
    });
  });
}

function renderAgentPanel(agentId) {
  const agent = agentsState.agents.find((a) => a.id === agentId);
  if (!agent) return;

  const session = getAgentSession(agentId);
  const investor = investors.find((inv) => inv.id === state.selectedInvestorId) || {};

  const defaultTicker = investor.ticker || "";
  const defaultCompanyName = investor.name || "";
  const effectiveTicker = session.inputTicker || defaultTicker;
  const effectiveCompanyName = session.inputCompanyName || defaultCompanyName;

  agentEls.runName.textContent = agent.name;
  agentEls.runId.textContent = `Agent ID: ${agent.id}`;
  agentEls.activeTitle.textContent = agent.name;

  agentEls.tickerInput.value = session.inputTicker;
  agentEls.tickerInput.placeholder = defaultTicker || "e.g. JIOFIN";
  agentEls.companyInput.value = session.inputCompanyName;
  agentEls.companyInput.placeholder = defaultCompanyName || "e.g. Jio Financial Services";

  agentEls.queryInput.value = session.userQuery;
  if (session.queryOpen) {
    agentEls.queryBlock.hidden = false;
  } else {
    agentEls.queryBlock.hidden = true;
  }

  agentEls.contextChips.innerHTML = [
    { label: "Library", value: agent.libraryId },
    ...(effectiveTicker ? [{ label: "Ticker", value: effectiveTicker }] : []),
    ...(effectiveCompanyName ? [{ label: "Company", value: effectiveCompanyName }] : []),
    ...(investor.sectorFocus ? [{ label: "Sector", value: investor.sectorFocus }] : []),
    ...(investor.worthCr ? [{ label: "Net Worth", value: currencyCr(investor.worthCr) }] : []),
  ]
    .map((chip) => `<span class="sector-chip">${chip.label}: ${chip.value}</span>`)
    .join("");

  if (session.activeAnalystId || session.analystOutputId) {
    agentEls.idsDiv.innerHTML = `
      ${session.activeAnalystId ? `<p><small>Active Analyst ID: ${session.activeAnalystId}</small></p>` : ""}
      ${session.analystOutputId ? `<p><small>Analyst Output ID: ${session.analystOutputId}</small></p>` : ""}
    `;
    agentEls.idsDiv.hidden = false;
  } else {
    agentEls.idsDiv.hidden = true;
  }

  if (session.error) {
    agentEls.output.innerHTML = `<p style="color: var(--danger);">${escapeHtml(session.error)}</p>`;
  } else if (session.markdown) {
    agentEls.output.innerHTML = renderAgentMarkdown(session.markdown);
  } else {
    agentEls.output.innerHTML = "<p class='agents-output-empty'>Run the agent to load output.</p>";
  }

  agentEls.runPanel.hidden = false;
}

function escapeHtml(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function openAddAgentModal() {
  agentEls.modal.setAttribute("aria-hidden", "false");
  agentEls.formId.focus();
}

function closeAddAgentModal() {
  agentEls.modal.setAttribute("aria-hidden", "true");
  agentEls.form.reset();
  agentEls.formError.hidden = true;
}

function handleAddAgent(e) {
  e.preventDefault();

  const id = slugify(agentEls.formId.value.trim());
  const name = agentEls.formName.value.trim();
  const libraryId = agentEls.formLibraryId.value.trim();

  if (!id || !name || !libraryId) {
    agentEls.formError.textContent = "All fields are required.";
    agentEls.formError.hidden = false;
    return;
  }

  if (agentsState.agents.some((a) => a.id === id)) {
    agentEls.formError.textContent = `Agent with ID "${id}" already exists.`;
    agentEls.formError.hidden = false;
    return;
  }

  agentsState.agents.push({ id, name, libraryId });
  agentsState.activeAgentId = id;
  saveAgents();
  closeAddAgentModal();
  renderAgentsTabs();
  renderAgentPanel(id);
}

function setupAgentsEvents() {
  agentEls.button.addEventListener("click", openAgentsView);
  agentEls.backBtn.addEventListener("click", closeAgentsView);
  agentEls.addAgentBtn.addEventListener("click", openAddAgentModal);

  agentEls.form.addEventListener("submit", handleAddAgent);

  document.querySelectorAll("[data-close-add-agent]").forEach((btn) => {
    btn.addEventListener("click", closeAddAgentModal);
  });

  agentEls.tokenToggle.addEventListener("click", () => {
    const isHidden = agentEls.tokenRow.hasAttribute("hidden");
    if (isHidden) {
      let current = "";
      try {
        current = localStorage.getItem(AGENT_TOKEN_KEY) || "";
      } catch {
        /* ignore */
      }
      agentEls.tokenInput.value = current;
      agentEls.tokenRow.hidden = false;
      renderAgentsTokenStatus();
      agentEls.tokenInput.focus();
    } else {
      agentEls.tokenRow.hidden = true;
    }
  });

  agentEls.tokenSave.addEventListener("click", () => {
    setMunsTokenOverride(agentEls.tokenInput.value);
    renderAgentsTokenStatus();
  });

  agentEls.tokenClear.addEventListener("click", () => {
    agentEls.tokenInput.value = "";
    setMunsTokenOverride("");
    renderAgentsTokenStatus();
  });

  agentEls.queryToggle.addEventListener("click", () => {
    const agent = agentsState.agents.find((a) => a.id === agentsState.activeAgentId);
    if (agent) {
      const session = getAgentSession(agent.id);
      patchAgentSession(agent.id, { queryOpen: !session.queryOpen });
      renderAgentPanel(agent.id);
    }
  });

  agentEls.tickerInput.addEventListener("change", () => {
    const agent = agentsState.agents.find((a) => a.id === agentsState.activeAgentId);
    if (agent) {
      patchAgentSession(agent.id, { inputTicker: agentEls.tickerInput.value });
    }
  });

  agentEls.companyInput.addEventListener("change", () => {
    const agent = agentsState.agents.find((a) => a.id === agentsState.activeAgentId);
    if (agent) {
      patchAgentSession(agent.id, { inputCompanyName: agentEls.companyInput.value });
    }
  });

  agentEls.queryInput.addEventListener("input", () => {
    const agent = agentsState.agents.find((a) => a.id === agentsState.activeAgentId);
    if (agent) {
      patchAgentSession(agent.id, { userQuery: agentEls.queryInput.value });
    }
  });

  agentEls.runButton.addEventListener("click", async () => {
    const agent = agentsState.agents.find((a) => a.id === agentsState.activeAgentId);
    if (!agent) return;

    const session = getAgentSession(agent.id);
    const investor = investors.find((inv) => inv.id === state.selectedInvestorId) || {};

    agentEls.runButton.disabled = true;
    agentEls.runButton.textContent = "Running...";

    const tickerToSend = agentEls.tickerInput.value.trim() || investor.ticker || "";
    const companyToSend = agentEls.companyInput.value.trim() || investor.name || "";

    const payload = {
      agent_library_id: agent.libraryId,
      ...(session.userQuery ? { user_query: session.userQuery } : {}),
      metadata: {
        stock_ticker: tickerToSend,
        stock_country: "INDIA",
        to_date: new Date().toISOString().split("T")[0],
        timezone: "UTC",
      },
    };

    try {
      const token = getMunsToken();
      if (!token) {
        throw new Error("Missing MUNS access token.");
      }

      const response = await fetch(`${MUNS_API_BASE}/agents/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();

      if (!response.ok) {
        throw new Error(`MUNS request failed (${response.status}).`);
      }

      const markdown = cleanStreamToMarkdown(raw);

      patchAgentSession(agent.id, {
        markdown,
        error: null,
        activeAnalystId: response.headers.get("x-active-analyst-id") || null,
        analystOutputId: response.headers.get("x-analyst-output-id") || null,
      });
      saveAgentSessions();

      renderAgentPanel(agent.id);
    } catch (err) {
      patchAgentSession(agent.id, { error: err.message });
      saveAgentSessions();
      renderAgentPanel(agent.id);
    } finally {
      agentEls.runButton.disabled = false;
      agentEls.runButton.textContent = "Run";
    }
  });
}

async function init() {
  try {
    investors = await loadInvestors();
  } catch (err) {
    console.error("Failed to load investors:", err);
    investors = [];
  }
  if (investors.length) {
    state.selectedInvestorId = investors[0].id;
    state.compareIds = investors.slice(0, 2).map((inv) => inv.id);
    directoryOptions.sector = ["All Sectors", ...new Set(investors.flatMap((inv) => inv.sectorFocus))];
  }
  populateDirectoryFilters();
  setupTabs();
  attachGlobalEvents();
  loadAgents();
  loadAgentSessions();
  setupAgentsEvents();
  syncGlobalSearch();
  renderDirectory();
  if (state.selectedInvestorId) {
    renderProfile(state.selectedInvestorId);
  }
}

init();
