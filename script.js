let investors = [];
const QUARTER_KEYS = ["jun25", "aug25", "sep25", "dec25", "mar26"];
const DIRECTORY_PAGE_SIZE = 6;
const SECTOR_PALETTE = ["#173a69", "#1f5ea8", "#317a85", "#5d7392", "#9db0c8", "#7a4a86", "#b07a3a", "#3a7a5d"];

async function loadInvestors() {
  const registryRes = await fetch("./investors.json", { cache: "no-store" });
  if (!registryRes.ok) throw new Error("investors.json fetch failed");
  const registry = await registryRes.json();
  const enriched = await Promise.all(
    registry.map(async (entry) => {
      const slug = slugifyInvestorKey(entry.name || entry.fund);
      let detail = { holdings: [], worthCr: 0, lastScrapedAt: null };
      try {
        const detailRes = await fetch(`./data/investors/${slug}.json`, { cache: "no-store" });
        if (detailRes.ok) detail = await detailRes.json();
      } catch (err) {
        console.warn(`No detail file for ${slug}, rendering stub.`);
      }
      return enrichInvestor(entry, detail, slug);
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
  const isStub = !detail.lastScrapedAt && holdings.length === 0;

  return {
    id: slug,
    name: reg.name || "",
    fund: reg.fund || "",
    initials: initialsFor(reg.name || reg.fund),
    type: detail.type || "Individual",
    sourceUrl: reg.url || "",
    lastScrapedAt: detail.lastScrapedAt || null,
    isStub,
    worthCr,
    holdingsCount: holdingsActive,
    sectorFocus,
    activity: activityLabel(counts),
    description: isStub
      ? "Holdings not yet scraped — click Refresh to fetch latest data."
      : `Portfolio anchored in ${focusList} with ${holdingsActive} disclosed live positions.`,
    bio: isStub
      ? "Awaiting first data scrape. Holdings, KPIs, and charts will populate once data is fetched."
      : `Tracked public-equity portfolio with ${holdingsActive} active holdings and a current disclosed value of ${currencyCr(worthCr)}.`,
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
const consensusView = document.querySelector("#consensus-view");
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
  directoryVisibleCount: DIRECTORY_PAGE_SIZE,
  holdingsSearch: "",
  holdingsSector: "All Sectors",
  holdingsStatus: "All Statuses",
  holdingsSort: {
    key: "valueCr",
    direction: "desc"
  },
  bookmarks: new Set(),
  bookmarksOnly: false,
  consensusFilters: {
    sector: "All Sectors",
    minHolders: "All",
    sort: "Aggregate Value"
  }
};

const BOOKMARKS_KEY = "vinainvest_bookmarks_v1";

function loadBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveBookmarks() {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...state.bookmarks]));
  } catch {
    /* ignore quota / disabled storage */
  }
}

function updateBookmarkButton() {
  const btn = document.querySelector("#profile-bookmark");
  if (!btn) return;
  const isBookmarked = state.bookmarks.has(state.selectedInvestorId);
  btn.textContent = isBookmarked ? "★ Bookmarked" : "☆ Bookmark";
  btn.classList.toggle("is-bookmarked", isBookmarked);
  btn.setAttribute("aria-pressed", String(isBookmarked));
}

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

    const matchesBookmark = !state.bookmarksOnly || state.bookmarks.has(investor.id);

    return matchesSearch && matchesType && matchesWorth && matchesHoldings && matchesSector && matchesActivity && matchesBookmark;
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

  const isBookmarked = state.bookmarks.has(investor.id);
  const bookmarkBadge = isBookmarked
    ? '<span class="bookmark-badge" title="Bookmarked" aria-label="Bookmarked">★</span>'
    : "";

  return `
    <article class="investor-card ${state.selectedInvestorId === investor.id ? "is-selected" : ""}" data-id="${investor.id}">
      ${bookmarkBadge}
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

  if (state.bookmarksOnly) active.push("★ Bookmarked only");
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

  const pagination = document.querySelector("#directory-pagination");

  if (!filteredInvestors.length) {
    const emptyKicker = state.bookmarksOnly ? "Saved Screens" : "No Results";
    const emptyTitle = state.bookmarksOnly && state.bookmarks.size === 0
      ? "You haven't bookmarked any investors yet."
      : "No investors match the current screen.";
    const emptyBody = state.bookmarksOnly && state.bookmarks.size === 0
      ? "Open an investor profile and click Bookmark to save it here."
      : "Relax one or more filters to broaden the directory view.";
    investorGrid.innerHTML = `
      <article class="panel">
        <p class="panel-kicker">${emptyKicker}</p>
        <h2>${emptyTitle}</h2>
        <p class="page-subtitle">${emptyBody}</p>
      </article>
    `;
    if (pagination) pagination.hidden = true;
    return;
  }

  const total = filteredInvestors.length;
  const visible = Math.min(state.directoryVisibleCount, total);
  const visibleInvestors = filteredInvestors.slice(0, visible);

  investorGrid.innerHTML = visibleInvestors.map(directoryCard).join("");

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

  if (pagination) {
    if (visible < total) {
      const remaining = total - visible;
      const nextChunk = Math.min(DIRECTORY_PAGE_SIZE, remaining);
      pagination.hidden = false;
      pagination.innerHTML = `
        <p class="directory-pagination__count">Showing ${visible} of ${total}</p>
        <button class="ghost-button directory-pagination__more" type="button">
          Load ${nextChunk} more
        </button>
      `;
      pagination.querySelector(".directory-pagination__more").addEventListener("click", () => {
        state.directoryVisibleCount = visible + nextChunk;
        renderDirectory();
      });
    } else {
      pagination.hidden = true;
      pagination.innerHTML = "";
    }
  }
}

function statusBadge(status) {
  const tone = status.toLowerCase().replace(/\s+/g, "-");
  return `<span class="status-badge status-badge--${tone}">${status}</span>`;
}

function escAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeCompanyName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[\.,]/g, "")
    .replace(/\s+(ltd|limited|inc|pvt|private)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findHoldersOfStock(companyName) {
  const norm = normalizeCompanyName(companyName);
  const holders = [];
  for (const investor of investors) {
    if (!investor.holdings) continue;
    for (const h of investor.holdings) {
      if (normalizeCompanyName(h.company) === norm) {
        holders.push({ investor, holding: h });
      }
    }
  }
  return holders.sort((a, b) => b.holding.valueCr - a.holding.valueCr);
}

function sparklineFromHolding(holding) {
  const series = QUARTER_KEYS.map((k) => holding[k]);
  const present = series.filter((v) => v !== null && v !== undefined);
  if (present.length < 2) return '<span class="sparkline-empty">—</span>';
  const max = Math.max(...present);
  const min = Math.min(...present);
  const range = Math.max(max - min, 0.01);
  const w = 90;
  const h = 28;
  const pad = 3;
  const points = [];
  series.forEach((v, i) => {
    if (v === null || v === undefined) return;
    const x = (i / (series.length - 1)) * (w - pad * 2) + pad;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${points.join(" ")}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function openStockDetail(companyName) {
  const holders = findHoldersOfStock(companyName);
  const drawer = document.querySelector("#stock-detail-drawer");
  const title = document.querySelector("#stock-detail-title");
  const summary = document.querySelector("#stock-detail-summary");
  const body = document.querySelector("#stock-detail-body");
  if (!drawer || !title || !summary || !body) return;

  title.textContent = companyName.trim();

  if (!holders.length) {
    summary.textContent = "No tracked investors hold this stock yet.";
    body.innerHTML = `
      <p class="page-subtitle">Once an investor with this position is scraped, their stake will appear here.</p>
    `;
  } else {
    const totalValueCr = holders.reduce((s, x) => s + x.holding.valueCr, 0);
    const sector = holders[0].holding.sector;
    summary.textContent = `${sector} · ${holders.length} tracked holder${holders.length === 1 ? "" : "s"} · ${currencyCr(totalValueCr)} total disclosed value`;

    body.innerHTML = holders.map((h) => {
      const inv = h.investor;
      const display = inv.name || inv.fund || "Unknown";
      const sub = inv.name && inv.fund ? inv.fund : "";
      return `
        <article class="stock-holder">
          <header class="stock-holder__top">
            <button class="text-button stock-holder__name" data-investor-id="${escAttr(inv.id)}">
              <strong>${display}</strong>
              ${sub ? `<span class="stock-holder__sub">${sub}</span>` : ""}
            </button>
            ${statusBadge(h.holding.status)}
          </header>
          <div class="stock-holder__metrics">
            <div class="stock-holder__metric">
              <span>Latest stake</span>
              <strong>${percentage(h.holding.mar26)}</strong>
            </div>
            <div class="stock-holder__metric">
              <span>Value</span>
              <strong>${h.holding.valueCr ? currencyCr(h.holding.valueCr) : "—"}</strong>
            </div>
            <div class="stock-holder__sparkline" aria-label="5-quarter stake trend">
              ${sparklineFromHolding(h.holding)}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
}

function closeStockDetail() {
  const drawer = document.querySelector("#stock-detail-drawer");
  if (!drawer) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  if (!compareDrawer.classList.contains("is-open")) {
    drawerBackdrop.hidden = true;
  }
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
  updateBookmarkButton();

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
            <div class="mini-list__name stock-link" data-stock="${escAttr(holding.company)}">${holding.company}</div>
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
          <h3 class="stock-link" data-stock="${escAttr(holding.company)}">${holding.company}</h3>
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
          <td><a class="company-link stock-link" href="#" data-stock="${escAttr(holding.company)}">${holding.company}</a></td>
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
  consensusView.classList.remove("is-active");
  activateTab("overview-panel");
  syncGlobalSearch();
  renderProfile(state.selectedInvestorId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openDirectoryView() {
  profileView.classList.remove("is-active");
  consensusView.classList.remove("is-active");
  directoryView.classList.add("is-active");
  syncGlobalSearch();
  renderDirectory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openConsensusView() {
  directoryView.classList.remove("is-active");
  profileView.classList.remove("is-active");
  consensusView.classList.add("is-active");
  populateConsensusFilters();
  renderConsensusView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildConsensusData() {
  const map = new Map();
  for (const investor of investors) {
    if (!Array.isArray(investor.holdings)) continue;
    for (const h of investor.holdings) {
      if (h.status === "Exited") continue;
      const key = normalizeCompanyName(h.company);
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          key,
          displayName: h.company.trim(),
          sector: h.sector || "Other",
          holders: [],
          totalValueCr: 0,
          stakeSum: 0,
          stakeCount: 0
        });
      }
      const entry = map.get(key);
      entry.holders.push({ investor, holding: h });
      entry.totalValueCr += h.valueCr;
      if (h.mar26 !== null && h.mar26 !== undefined) {
        entry.stakeSum += h.mar26;
        entry.stakeCount += 1;
      }
    }
  }
  return [...map.values()].map((e) => ({
    key: e.key,
    displayName: e.displayName,
    sector: e.sector,
    holderCount: e.holders.length,
    totalValueCr: e.totalValueCr,
    avgStake: e.stakeCount ? e.stakeSum / e.stakeCount : 0,
    holders: e.holders.sort((a, b) => b.holding.valueCr - a.holding.valueCr)
  }));
}

function populateConsensusFilters() {
  const data = buildConsensusData();
  const sectors = ["All Sectors", ...new Set(data.map((d) => d.sector))].sort((a, b) => {
    if (a === "All Sectors") return -1;
    if (b === "All Sectors") return 1;
    return a.localeCompare(b);
  });
  const sectorEl = document.querySelector("#consensus-sector-filter");
  if (sectorEl) {
    sectorEl.innerHTML = sectors.map((s) => `<option>${s}</option>`).join("");
    if (!sectors.includes(state.consensusFilters.sector)) state.consensusFilters.sector = "All Sectors";
    sectorEl.value = state.consensusFilters.sector;
  }
  const minEl = document.querySelector("#consensus-min-holders-filter");
  if (minEl) minEl.value = state.consensusFilters.minHolders;
  const sortEl = document.querySelector("#consensus-sort");
  if (sortEl) sortEl.value = state.consensusFilters.sort;
}

function renderConsensusView() {
  const all = buildConsensusData();
  const minHoldersMap = { All: 1, "2+": 2, "3+": 3, "5+": 5, "10+": 10 };
  const minHolders = minHoldersMap[state.consensusFilters.minHolders] || 1;
  const filtered = all.filter((row) => {
    const sectorOk = state.consensusFilters.sector === "All Sectors" || row.sector === state.consensusFilters.sector;
    return sectorOk && row.holderCount >= minHolders;
  });
  const sorted = filtered.sort((a, b) => {
    switch (state.consensusFilters.sort) {
      case "Holder Count":
        return b.holderCount - a.holderCount || b.totalValueCr - a.totalValueCr;
      case "Avg Stake %":
        return b.avgStake - a.avgStake;
      case "Alphabetical":
        return a.displayName.localeCompare(b.displayName);
      case "Aggregate Value":
      default:
        return b.totalValueCr - a.totalValueCr;
    }
  });

  document.querySelector("#consensus-stock-count").textContent = String(all.length).padStart(2, "0");
  document.querySelector("#consensus-total-value").textContent = currencyCr(all.reduce((s, x) => s + x.totalValueCr, 0));
  document.querySelector("#consensus-multi-count").textContent = String(all.filter((x) => x.holderCount >= 2).length).padStart(2, "0");

  const resultsCopy = document.querySelector("#consensus-results-copy");
  if (resultsCopy) {
    resultsCopy.textContent = `${sorted.length} stock${sorted.length === 1 ? "" : "s"} match the current filters.`;
  }

  const body = document.querySelector("#consensus-body");
  if (!body) return;
  if (!sorted.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="change-card">
            <strong>No stocks match the current filters.</strong>
            <p>Relax sector or min-holders to broaden the consensus universe.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = sorted
    .map((row, i) => {
      const topHolders = row.holders.slice(0, 4)
        .map((h) => `<span class="holder-chip" title="${escAttr(h.investor.name || h.investor.fund)} · ${escAttr(currencyCr(h.holding.valueCr))}" data-investor-id="${escAttr(h.investor.id)}">${escAttr(h.investor.initials)}</span>`)
        .join("");
      const moreCount = row.holders.length > 4 ? `<span class="holder-chip holder-chip--more">+${row.holders.length - 4}</span>` : "";
      return `
        <tr>
          <td class="is-numeric">${i + 1}</td>
          <td><a class="company-link stock-link" href="#" data-stock="${escAttr(row.displayName)}">${row.displayName}</a></td>
          <td>${row.sector}</td>
          <td class="is-numeric">${row.holderCount}</td>
          <td class="is-numeric">${currencyCr(row.totalValueCr)}</td>
          <td class="is-numeric">${row.avgStake.toFixed(2)}%</td>
          <td><div class="holders-stack">${topHolders}${moreCount}</div></td>
        </tr>
      `;
    })
    .join("");
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
    button.addEventListener("click", () => {
      const target = button.dataset.tabTarget;
      activateTab(target);
      const panel = document.querySelector(`#${target}`);
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
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
      state.directoryVisibleCount = DIRECTORY_PAGE_SIZE;
      renderDirectory();
    });
  });

  globalSearchInput.addEventListener("input", (event) => {
    if (directoryView.classList.contains("is-active")) {
      state.directorySearch = event.target.value.trim();
      state.directoryVisibleCount = DIRECTORY_PAGE_SIZE;
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
  document.querySelector("#consensus-button").addEventListener("click", openConsensusView);
  document.querySelector("#back-from-consensus").addEventListener("click", openDirectoryView);

  const consensusFilters = [
    ["#consensus-sector-filter", "sector"],
    ["#consensus-min-holders-filter", "minHolders"],
    ["#consensus-sort", "sort"]
  ];
  consensusFilters.forEach(([sel, key]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener("change", () => {
      state.consensusFilters[key] = el.value;
      renderConsensusView();
    });
  });

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
    state.directoryVisibleCount = DIRECTORY_PAGE_SIZE;
    state.bookmarksOnly = false;
    populateDirectoryFilters();
    syncGlobalSearch();
    updateSavedScreensButton();
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
  drawerBackdrop.addEventListener("click", () => {
    toggleCompareDrawer(false);
    closeStockDetail();
  });

  document.querySelector("#close-stock-detail").addEventListener("click", closeStockDetail);

  document.body.addEventListener("click", (event) => {
    const stockEl = event.target.closest("[data-stock]");
    if (stockEl) {
      event.preventDefault();
      openStockDetail(stockEl.dataset.stock);
      return;
    }
    const investorEl = event.target.closest("[data-investor-id]");
    if (investorEl && investorEl.dataset.investorId) {
      const id = investorEl.dataset.investorId;
      closeStockDetail();
      state.selectedInvestorId = id;
      openProfileView();
    }
  });

  document.querySelector("#profile-refresh").addEventListener("click", handleRefreshClick);

  document.querySelector("#profile-bookmark").addEventListener("click", () => {
    const id = state.selectedInvestorId;
    if (!id) return;
    if (state.bookmarks.has(id)) state.bookmarks.delete(id);
    else state.bookmarks.add(id);
    saveBookmarks();
    updateBookmarkButton();
    updateSavedScreensButton();
    renderDirectory();
  });

  document.querySelector("#saved-screens-button").addEventListener("click", () => {
    state.bookmarksOnly = !state.bookmarksOnly;
    state.directoryVisibleCount = DIRECTORY_PAGE_SIZE;
    updateSavedScreensButton();
    if (!directoryView.classList.contains("is-active")) openDirectoryView();
    else renderDirectory();
  });
  updateSavedScreensButton();
}

function updateSavedScreensButton() {
  const btn = document.querySelector("#saved-screens-button");
  if (!btn) return;
  const count = state.bookmarks.size;
  btn.textContent = state.bookmarksOnly
    ? `Showing Saved (${count})`
    : count > 0
      ? `Saved Screens (${count})`
      : "Saved Screens";
  btn.classList.toggle("is-active", state.bookmarksOnly);
  btn.setAttribute("aria-pressed", String(state.bookmarksOnly));
}

async function handleRefreshClick() {
  const btn = document.querySelector("#profile-refresh");
  const status = document.querySelector("#profile-refresh-status");
  const investor = investors.find((inv) => inv.id === state.selectedInvestorId);
  if (!investor) return;
  if (!investor.sourceUrl) {
    showRefreshStatus(status, "No source URL set for this investor — add one to investors.json before refreshing.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Refreshing...";
  showRefreshStatus(status, "Triggering scrape — this takes ~90 seconds.", "pending");

  try {
    const res = await fetch("/api/refresh-investor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: investor.id, url: investor.sourceUrl })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = payload.error || `Request failed (${res.status}).`;
      throw new Error(payload.detail ? `${msg} ${payload.detail}` : msg);
    }
    const runsUrl = payload.runsUrl || "https://github.com/ceekay-munshot/vinainvest/actions";
    showRefreshStatus(
      status,
      `Workflow dispatched. <a href="${runsUrl}" target="_blank" rel="noopener">Watch progress</a>. Reload this page in ~90 seconds.`,
      "success",
      true
    );
  } catch (err) {
    showRefreshStatus(status, `Refresh failed: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Refresh";
  }
}

function showRefreshStatus(el, message, tone, allowHtml = false) {
  el.hidden = false;
  el.dataset.tone = tone;
  if (allowHtml) {
    el.innerHTML = message;
  } else {
    el.textContent = message;
  }
}


async function init() {
  state.bookmarks = loadBookmarks();
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
  syncGlobalSearch();
  renderDirectory();
  if (state.selectedInvestorId) {
    renderProfile(state.selectedInvestorId);
  }
}

init();
