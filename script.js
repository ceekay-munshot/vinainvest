const investors = [
  {
    id: "rk-damani",
    name: "Radhakishan Damani",
    initials: "RD",
    fund: "Brightstar Holdings",
    type: "Individual",
    worthCr: 38420,
    holdingsCount: 22,
    sectorFocus: ["Consumer", "Retail", "Financials"],
    activity: "High",
    description: "Concentrated, long-duration compounding portfolio anchored in retail, consumer franchises, and select financial businesses.",
    bio: "Widely tracked for high-conviction public equity positions, with a bias toward durable cash-flow businesses and measured portfolio turnover.",
    activeSince: "1999",
    style: "Concentrated compounder",
    concentration: "High",
    keySectors: "Consumer, Retail, Financials",
    kpis: [
      { label: "Total Portfolio Value", value: "₹38,420 Cr", note: "Latest market value estimate" },
      { label: "Active Holdings", value: "22", note: "Disclosed live positions" },
      { label: "New Additions", value: "02", note: "Positions initiated this quarter" },
      { label: "Increased Stakes", value: "05", note: "Meaningful ownership increases" },
      { label: "Reduced Stakes", value: "03", note: "Portfolio trims" },
      { label: "Exits / Inactive", value: "01", note: "Exited or filing due" }
    ],
    topHoldings: [
      { company: "Avenue Supermarts", sector: "Retail", value: "₹13,860 Cr" },
      { company: "VST Industries", sector: "Consumer", value: "₹6,240 Cr" },
      { company: "Blue Dart Express", sector: "Logistics", value: "₹4,180 Cr" },
      { company: "Trent", sector: "Retail", value: "₹3,960 Cr" }
    ],
    sectorAllocation: [
      { sector: "Retail", value: 35, amount: "₹13,447 Cr", color: "#173a69" },
      { sector: "Consumer", value: 22, amount: "₹8,452 Cr", color: "#1f5ea8" },
      { sector: "Financials", value: 19, amount: "₹7,300 Cr", color: "#317a85" },
      { sector: "Logistics", value: 12, amount: "₹4,610 Cr", color: "#5d7392" },
      { sector: "Others", value: 12, amount: "₹4,611 Cr", color: "#9db0c8" }
    ],
    timeline: [
      { date: "18 Apr 2026", title: "Increased position in Trent", body: "Stake moved to 1.82% from 1.47% as retail exposure widened." },
      { date: "11 Apr 2026", title: "New disclosure in Supreme Industries", body: "Fresh 1.05% position adds industrial building materials exposure." },
      { date: "29 Mar 2026", title: "Reduced Blue Dart stake", body: "Trimmed 42 bps while retaining core ownership." }
    ],
    concentrationSummary: {
      title: "Top 5 holdings account for 68% of portfolio value",
      body: "Portfolio remains deliberately concentrated, with the leading retail and consumer positions doing most of the heavy lifting.",
      topFive: 68,
      topTen: 84
    },
    themeSummary: {
      title: "Consumer-led quality bias",
      body: "The current mix still leans into branded consumption, organized retail, and selective financial operating leverage. Turnover is measured rather than tactical."
    },
    notes: [
      { title: "Conviction profile", body: "Name count remains controlled. New positions tend to start small before sizing up across subsequent quarters." },
      { title: "Watch item", body: "Monitor whether logistics exposure is trimmed further after recent price strength." },
      { title: "Research angle", body: "Cross-check any new retail additions against demand commentary and same-store growth data." }
    ],
    holdings: [
      { company: "Avenue Supermarts", sector: "Retail", jun25: 1.41, aug25: 1.41, sep25: 1.44, dec25: 1.44, mar26: 1.46, valueCr: 13860, status: "Increased" },
      { company: "VST Industries", sector: "Consumer", jun25: 32.66, aug25: 32.66, sep25: 32.66, dec25: 32.66, mar26: 32.66, valueCr: 6240, status: "Unchanged" },
      { company: "Blue Dart Express", sector: "Logistics", jun25: 3.28, aug25: 3.28, sep25: 3.12, dec25: 2.96, mar26: 2.86, valueCr: 4180, status: "Reduced" },
      { company: "Trent", sector: "Retail", jun25: 1.17, aug25: 1.24, sep25: 1.36, dec25: 1.47, mar26: 1.82, valueCr: 3960, status: "Increased" },
      { company: "Sundaram Finance", sector: "Financials", jun25: 2.85, aug25: 2.85, sep25: 2.91, dec25: 3.02, mar26: 3.02, valueCr: 3180, status: "Increased" },
      { company: "United Breweries", sector: "Consumer", jun25: 1.14, aug25: 1.14, sep25: 1.14, dec25: 1.14, mar26: 1.14, valueCr: 1940, status: "Unchanged" },
      { company: "Supreme Industries", sector: "Industrials", jun25: null, aug25: null, sep25: null, dec25: null, mar26: 1.05, valueCr: 1210, status: "New" },
      { company: "ICICI Bank", sector: "Financials", jun25: 0.22, aug25: 0.22, sep25: 0.26, dec25: 0.28, mar26: 0.31, valueCr: 1450, status: "Increased" },
      { company: "3M India", sector: "Industrials", jun25: 0.63, aug25: 0.63, sep25: 0.59, dec25: 0.55, mar26: 0.55, valueCr: 980, status: "Reduced" },
      { company: "Schaeffler India", sector: "Industrials", jun25: 1.91, aug25: 1.91, sep25: 1.91, dec25: 1.91, mar26: null, valueCr: 0, status: "Exited" }
    ]
  },
  {
    id: "rekha-jhunjhunwala",
    name: "Rekha Jhunjhunwala",
    initials: "RJ",
    fund: "Rare Equity Office",
    type: "Individual",
    worthCr: 27640,
    holdingsCount: 29,
    sectorFocus: ["Financials", "Consumer", "Healthcare"],
    activity: "Medium",
    description: "Broad but curated portfolio spanning consumer brands, lenders, healthcare, and cyclical re-rating opportunities.",
    bio: "A closely followed disclosure profile with diversified exposure and selective position changes across sectors with long runway characteristics.",
    activeSince: "2003",
    style: "Quality with opportunistic rotation",
    concentration: "Medium",
    keySectors: "Financials, Consumer, Healthcare",
    kpis: [
      { label: "Total Portfolio Value", value: "₹27,640 Cr", note: "Latest market value estimate" },
      { label: "Active Holdings", value: "29", note: "Disclosed live positions" },
      { label: "New Additions", value: "03", note: "Positions initiated this quarter" },
      { label: "Increased Stakes", value: "04", note: "Meaningful ownership increases" },
      { label: "Reduced Stakes", value: "06", note: "Portfolio trims" },
      { label: "Exits / Inactive", value: "02", note: "Exited or filing due" }
    ],
    topHoldings: [
      { company: "Titan Company", sector: "Consumer", value: "₹8,440 Cr" },
      { company: "Canara Bank", sector: "Financials", value: "₹3,920 Cr" },
      { company: "Metro Brands", sector: "Retail", value: "₹2,810 Cr" },
      { company: "Fortis Healthcare", sector: "Healthcare", value: "₹2,420 Cr" }
    ],
    sectorAllocation: [
      { sector: "Consumer", value: 31, amount: "₹8,568 Cr", color: "#173a69" },
      { sector: "Financials", value: 26, amount: "₹7,186 Cr", color: "#1f5ea8" },
      { sector: "Healthcare", value: 18, amount: "₹4,975 Cr", color: "#317a85" },
      { sector: "Retail", value: 15, amount: "₹4,146 Cr", color: "#5d7392" },
      { sector: "Others", value: 10, amount: "₹2,765 Cr", color: "#9db0c8" }
    ],
    timeline: [
      { date: "16 Apr 2026", title: "Added to Jubilant Pharmova", body: "Fresh healthcare exposure through a 1.18% position." },
      { date: "01 Apr 2026", title: "Reduced stake in NCC", body: "Trim follows strong run-up in order book-driven names." },
      { date: "19 Mar 2026", title: "Maintained Titan position", body: "Core consumer holding remains unchanged despite elevated valuation." }
    ],
    concentrationSummary: {
      title: "Top 5 holdings account for 54% of portfolio value",
      body: "The portfolio is still diversified relative to peers, with enough room to express sector views without becoming overly diffuse.",
      topFive: 54,
      topTen: 73
    },
    themeSummary: {
      title: "Balanced all-weather book",
      body: "Exposure is distributed across consumption, lenders, and hospital/healthcare assets, leaving room for tactical trims without changing the overall posture."
    },
    notes: [
      { title: "Watch item", body: "Monitor whether recent healthcare additions become a larger sleeve over the next two filings." },
      { title: "Research angle", body: "Assess if consumer exposure continues to dominate despite incremental financials and healthcare adds." },
      { title: "Portfolio behavior", body: "This book often shows gradual position management rather than abrupt factor rotations." }
    ],
    holdings: [
      { company: "Titan Company", sector: "Consumer", jun25: 5.16, aug25: 5.16, sep25: 5.16, dec25: 5.16, mar26: 5.16, valueCr: 8440, status: "Unchanged" },
      { company: "Canara Bank", sector: "Financials", jun25: 1.57, aug25: 1.57, sep25: 1.57, dec25: 1.63, mar26: 1.72, valueCr: 3920, status: "Increased" },
      { company: "Metro Brands", sector: "Retail", jun25: 8.05, aug25: 8.05, sep25: 8.05, dec25: 8.05, mar26: 8.05, valueCr: 2810, status: "Unchanged" },
      { company: "Fortis Healthcare", sector: "Healthcare", jun25: 1.79, aug25: 1.79, sep25: 1.79, dec25: 1.79, mar26: 1.79, valueCr: 2420, status: "Unchanged" },
      { company: "Jubilant Pharmova", sector: "Healthcare", jun25: null, aug25: null, sep25: null, dec25: null, mar26: 1.18, valueCr: 910, status: "New" },
      { company: "NCC", sector: "Industrials", jun25: 1.42, aug25: 1.42, sep25: 1.36, dec25: 1.24, mar26: 0.98, valueCr: 860, status: "Reduced" },
      { company: "Indian Hotels", sector: "Consumer", jun25: 2.04, aug25: 2.04, sep25: 2.11, dec25: 2.11, mar26: 2.26, valueCr: 1340, status: "Increased" },
      { company: "Star Health", sector: "Financials", jun25: 1.08, aug25: 1.08, sep25: 1.08, dec25: 0.94, mar26: 0.82, valueCr: 740, status: "Reduced" },
      { company: "Crisil", sector: "Financials", jun25: 5.49, aug25: 5.49, sep25: 5.49, dec25: 5.49, mar26: null, valueCr: 0, status: "Exited" },
      { company: "Nazara Technologies", sector: "Technology", jun25: 3.61, aug25: 3.61, sep25: 3.61, dec25: 3.61, mar26: 3.61, valueCr: 1180, status: "Unchanged" }
    ]
  },
  {
    id: "ashish-kacholia",
    name: "Ashish Kacholia",
    initials: "AK",
    fund: "Lucky Investments",
    type: "Individual",
    worthCr: 11890,
    holdingsCount: 34,
    sectorFocus: ["Industrials", "Consumer", "Technology"],
    activity: "High",
    description: "Mid-cap oriented portfolio with thematic rotation across manufacturing, specialty businesses, and emerging platform leaders.",
    bio: "Tracks fast-growing listed businesses with room for scale, often across mid-cap industrial, consumer, and technology-linked sectors.",
    activeSince: "2005",
    style: "Mid-cap growth",
    concentration: "Medium",
    keySectors: "Industrials, Consumer, Technology",
    kpis: [
      { label: "Total Portfolio Value", value: "₹11,890 Cr", note: "Latest market value estimate" },
      { label: "Active Holdings", value: "34", note: "Disclosed live positions" },
      { label: "New Additions", value: "04", note: "Positions initiated this quarter" },
      { label: "Increased Stakes", value: "08", note: "Meaningful ownership increases" },
      { label: "Reduced Stakes", value: "05", note: "Portfolio trims" },
      { label: "Exits / Inactive", value: "03", note: "Exited or filing due" }
    ],
    topHoldings: [
      { company: "Safari Industries", sector: "Consumer", value: "₹1,760 Cr" },
      { company: "Mastek", sector: "Technology", value: "₹1,420 Cr" },
      { company: "Ami Organics", sector: "Chemicals", value: "₹1,260 Cr" },
      { company: "Shaily Engineering", sector: "Industrials", value: "₹1,110 Cr" }
    ],
    sectorAllocation: [
      { sector: "Industrials", value: 29, amount: "₹3,448 Cr", color: "#173a69" },
      { sector: "Consumer", value: 22, amount: "₹2,616 Cr", color: "#1f5ea8" },
      { sector: "Technology", value: 18, amount: "₹2,140 Cr", color: "#317a85" },
      { sector: "Chemicals", value: 17, amount: "₹2,021 Cr", color: "#5d7392" },
      { sector: "Others", value: 14, amount: "₹1,665 Cr", color: "#9db0c8" }
    ],
    timeline: [
      { date: "20 Apr 2026", title: "Raised Shaily Engineering holding", body: "Position increased again after order momentum continued." },
      { date: "12 Apr 2026", title: "Fresh disclosure in Rategain", body: "New software-services position adds another platform play." },
      { date: "31 Mar 2026", title: "Reduced Ami Organics", body: "Trimmed after strong quarter-on-quarter price performance." }
    ],
    concentrationSummary: {
      title: "Top 5 holdings account for 47% of portfolio value",
      body: "Portfolio breadth is wider and more exploratory, which suits the mid-cap growth style and leaves capacity for fresh themes.",
      topFive: 47,
      topTen: 67
    },
    themeSummary: {
      title: "Active rotation into growth niches",
      body: "The book remains more dynamic than the concentrated compounder cohort, with a clear preference for scalable niche operators and manufacturing adjacencies."
    },
    notes: [
      { title: "Watch item", body: "Check whether software/platform names continue to expand as a portfolio sleeve." },
      { title: "Research angle", body: "Model concentration risk if the strongest industrial performers keep scaling within the book." },
      { title: "Behavior", body: "Higher turnover makes the change log especially informative quarter to quarter." }
    ],
    holdings: [
      { company: "Safari Industries", sector: "Consumer", jun25: 2.32, aug25: 2.32, sep25: 2.44, dec25: 2.61, mar26: 2.61, valueCr: 1760, status: "Increased" },
      { company: "Mastek", sector: "Technology", jun25: 1.98, aug25: 1.98, sep25: 1.98, dec25: 2.05, mar26: 2.05, valueCr: 1420, status: "Increased" },
      { company: "Ami Organics", sector: "Chemicals", jun25: 2.84, aug25: 2.84, sep25: 2.58, dec25: 2.42, mar26: 2.26, valueCr: 1260, status: "Reduced" },
      { company: "Shaily Engineering", sector: "Industrials", jun25: 1.54, aug25: 1.71, sep25: 1.88, dec25: 2.04, mar26: 2.19, valueCr: 1110, status: "Increased" },
      { company: "Rategain", sector: "Technology", jun25: null, aug25: null, sep25: null, dec25: null, mar26: 1.06, valueCr: 690, status: "New" },
      { company: "Xpro India", sector: "Industrials", jun25: 1.87, aug25: 1.87, sep25: 1.87, dec25: 1.87, mar26: null, valueCr: 0, status: "Exited" },
      { company: "Tanfac Industries", sector: "Chemicals", jun25: 4.92, aug25: 4.92, sep25: 4.58, dec25: 4.22, mar26: 4.22, valueCr: 860, status: "Reduced" },
      { company: "Yasho Industries", sector: "Chemicals", jun25: 1.84, aug25: 1.84, sep25: 1.96, dec25: 2.04, mar26: 2.04, valueCr: 710, status: "Increased" },
      { company: "Fineotex Chemical", sector: "Chemicals", jun25: 1.06, aug25: 1.06, sep25: 1.06, dec25: 1.06, mar26: 1.06, valueCr: 520, status: "Unchanged" },
      { company: "Poly Medicure", sector: "Healthcare", jun25: 1.11, aug25: 1.11, sep25: 1.11, dec25: 1.11, mar26: 1.24, valueCr: 780, status: "Increased" }
    ]
  },
  {
    id: "vijay-kedia",
    name: "Vijay Kedia",
    initials: "VK",
    fund: "Kedia Securities",
    type: "Individual",
    worthCr: 9680,
    holdingsCount: 18,
    sectorFocus: ["Industrials", "Infrastructure", "Consumer"],
    activity: "Medium",
    description: "High-conviction portfolio with long holding periods and emphasis on business quality, management, and operating runway.",
    bio: "Known for patient ownership in smaller listed companies where management quality and execution are central to the investment case.",
    activeSince: "1992",
    style: "High-conviction quality growth",
    concentration: "High",
    keySectors: "Industrials, Infrastructure, Consumer",
    kpis: [
      { label: "Total Portfolio Value", value: "₹9,680 Cr", note: "Latest market value estimate" },
      { label: "Active Holdings", value: "18", note: "Disclosed live positions" },
      { label: "New Additions", value: "01", note: "Positions initiated this quarter" },
      { label: "Increased Stakes", value: "03", note: "Meaningful ownership increases" },
      { label: "Reduced Stakes", value: "02", note: "Portfolio trims" },
      { label: "Exits / Inactive", value: "01", note: "Exited or filing due" }
    ],
    topHoldings: [
      { company: "Tejas Networks", sector: "Technology", value: "₹1,980 Cr" },
      { company: "Atul Auto", sector: "Automotive", value: "₹1,420 Cr" },
      { company: "Vaibhav Global", sector: "Consumer", value: "₹1,180 Cr" },
      { company: "Cera Sanitaryware", sector: "Consumer", value: "₹960 Cr" }
    ],
    sectorAllocation: [
      { sector: "Industrials", value: 28, amount: "₹2,710 Cr", color: "#173a69" },
      { sector: "Consumer", value: 27, amount: "₹2,614 Cr", color: "#1f5ea8" },
      { sector: "Infrastructure", value: 20, amount: "₹1,936 Cr", color: "#317a85" },
      { sector: "Technology", value: 15, amount: "₹1,452 Cr", color: "#5d7392" },
      { sector: "Others", value: 10, amount: "₹968 Cr", color: "#9db0c8" }
    ],
    timeline: [
      { date: "09 Apr 2026", title: "Raised stake in Cera Sanitaryware", body: "Increase supports consumer-facing building products thesis." },
      { date: "25 Mar 2026", title: "Trimmed Tejas Networks", body: "Partial profit booking while keeping core exposure." },
      { date: "18 Mar 2026", title: "New filing in Elecon Engineering", body: "Adds industrial machinery exposure." }
    ],
    concentrationSummary: {
      title: "Top 5 holdings account for 64% of portfolio value",
      body: "The profile is relatively focused, reflecting a willingness to let long-duration winners become meaningful parts of the portfolio.",
      topFive: 64,
      topTen: 82
    },
    themeSummary: {
      title: "Focused ownership in scalable franchises",
      body: "Holdings skew toward businesses where execution visibility and management alignment matter more than broad macro factor calls."
    },
    notes: [
      { title: "Watch item", body: "Follow whether recent trims become broader rebalancing across outperforming technology names." },
      { title: "Research angle", body: "Compare any new industrial additions against order-cycle durability." },
      { title: "Behavior", body: "Position changes are infrequent enough that each filing usually carries signal." }
    ],
    holdings: [
      { company: "Tejas Networks", sector: "Technology", jun25: 1.84, aug25: 1.84, sep25: 1.84, dec25: 1.74, mar26: 1.58, valueCr: 1980, status: "Reduced" },
      { company: "Atul Auto", sector: "Automotive", jun25: 6.22, aug25: 6.22, sep25: 6.22, dec25: 6.22, mar26: 6.22, valueCr: 1420, status: "Unchanged" },
      { company: "Vaibhav Global", sector: "Consumer", jun25: 1.96, aug25: 1.96, sep25: 1.96, dec25: 2.04, mar26: 2.04, valueCr: 1180, status: "Increased" },
      { company: "Cera Sanitaryware", sector: "Consumer", jun25: 1.28, aug25: 1.28, sep25: 1.32, dec25: 1.39, mar26: 1.48, valueCr: 960, status: "Increased" },
      { company: "Elecon Engineering", sector: "Industrials", jun25: null, aug25: null, sep25: null, dec25: null, mar26: 1.09, valueCr: 620, status: "New" },
      { company: "Heritage Foods", sector: "Consumer", jun25: 1.04, aug25: 1.04, sep25: 1.04, dec25: 1.04, mar26: 1.04, valueCr: 540, status: "Unchanged" },
      { company: "Neuland Labs", sector: "Healthcare", jun25: 1.18, aug25: 1.18, sep25: 1.18, dec25: 1.18, mar26: null, valueCr: 0, status: "Exited" },
      { company: "Patel Engineering", sector: "Infrastructure", jun25: 2.42, aug25: 2.42, sep25: 2.56, dec25: 2.56, mar26: 2.74, valueCr: 710, status: "Increased" },
      { company: "Sudarshan Chemical", sector: "Chemicals", jun25: 1.04, aug25: 1.04, sep25: 1.04, dec25: 1.01, mar26: 1.01, valueCr: 450, status: "Reduced" },
      { company: "Mahindra Holidays", sector: "Consumer", jun25: 1.65, aug25: 1.65, sep25: 1.65, dec25: 1.65, mar26: 1.65, valueCr: 520, status: "Unchanged" }
    ]
  },
  {
    id: "porinju-veliyath",
    name: "Porinju Veliyath",
    initials: "PV",
    fund: "Equity Intelligence India",
    type: "Fund",
    worthCr: 6240,
    holdingsCount: 27,
    sectorFocus: ["Industrials", "Financials", "Special Situations"],
    activity: "High",
    description: "More opportunistic portfolio mix with special situations, cyclical recovery ideas, and rotation across smaller-cap names.",
    bio: "Often expresses views through underfollowed companies where balance sheet or business-cycle change can drive a re-rating.",
    activeSince: "2010",
    style: "Special situations",
    concentration: "Medium",
    keySectors: "Industrials, Financials, Special Situations",
    kpis: [
      { label: "Total Portfolio Value", value: "₹6,240 Cr", note: "Latest market value estimate" },
      { label: "Active Holdings", value: "27", note: "Disclosed live positions" },
      { label: "New Additions", value: "05", note: "Positions initiated this quarter" },
      { label: "Increased Stakes", value: "06", note: "Meaningful ownership increases" },
      { label: "Reduced Stakes", value: "07", note: "Portfolio trims" },
      { label: "Exits / Inactive", value: "02", note: "Exited or filing due" }
    ],
    topHoldings: [
      { company: "Dhanlaxmi Bank", sector: "Financials", value: "₹920 Cr" },
      { company: "Precision Camshafts", sector: "Automotive", value: "₹760 Cr" },
      { company: "Kerala Ayurveda", sector: "Healthcare", value: "₹520 Cr" },
      { company: "Geojit Financial", sector: "Financials", value: "₹460 Cr" }
    ],
    sectorAllocation: [
      { sector: "Industrials", value: 24, amount: "₹1,498 Cr", color: "#173a69" },
      { sector: "Financials", value: 24, amount: "₹1,498 Cr", color: "#1f5ea8" },
      { sector: "Healthcare", value: 18, amount: "₹1,123 Cr", color: "#317a85" },
      { sector: "Automotive", value: 16, amount: "₹998 Cr", color: "#5d7392" },
      { sector: "Others", value: 18, amount: "₹1,123 Cr", color: "#9db0c8" }
    ],
    timeline: [
      { date: "17 Apr 2026", title: "Added Kerala Ayurveda", body: "New thematic healthcare position disclosed at 2.14%." },
      { date: "04 Apr 2026", title: "Raised Dhanlaxmi Bank holding", body: "Increase extends existing financials thesis." },
      { date: "22 Mar 2026", title: "Reduced Geojit exposure", body: "Trimmed after a strong move but position remains active." }
    ],
    concentrationSummary: {
      title: "Top 5 holdings account for 42% of portfolio value",
      body: "Portfolio breadth is higher and conviction is spread across a more eclectic set of names, reducing single-position dominance.",
      topFive: 42,
      topTen: 60
    },
    themeSummary: {
      title: "Event-driven and cyclical posture",
      body: "This mix looks for inflection more than stability, so change status and fresh filings are particularly important context for the team."
    },
    notes: [
      { title: "Watch item", body: "Track whether recent healthcare additions are one-off or the start of a larger sleeve." },
      { title: "Research angle", body: "Map position changes against balance-sheet improvement and recovery catalysts." },
      { title: "Behavior", body: "Higher change velocity means quarter-to-quarter portfolio snapshots can shift meaningfully." }
    ],
    holdings: [
      { company: "Dhanlaxmi Bank", sector: "Financials", jun25: 7.88, aug25: 7.88, sep25: 8.04, dec25: 8.36, mar26: 8.91, valueCr: 920, status: "Increased" },
      { company: "Precision Camshafts", sector: "Automotive", jun25: 4.14, aug25: 4.14, sep25: 4.14, dec25: 4.14, mar26: 4.14, valueCr: 760, status: "Unchanged" },
      { company: "Kerala Ayurveda", sector: "Healthcare", jun25: null, aug25: null, sep25: null, dec25: null, mar26: 2.14, valueCr: 520, status: "New" },
      { company: "Geojit Financial", sector: "Financials", jun25: 4.62, aug25: 4.62, sep25: 4.28, dec25: 4.02, mar26: 3.58, valueCr: 460, status: "Reduced" },
      { company: "Accelya Solutions", sector: "Technology", jun25: 1.04, aug25: 1.04, sep25: 1.04, dec25: 1.04, mar26: null, valueCr: 0, status: "Exited" },
      { company: "S H Kelkar", sector: "Consumer", jun25: 2.41, aug25: 2.41, sep25: 2.41, dec25: 2.41, mar26: 2.41, valueCr: 430, status: "Unchanged" },
      { company: "Federal-Mogul Goetze", sector: "Automotive", jun25: 2.56, aug25: 2.56, sep25: 2.81, dec25: 2.81, mar26: 3.12, valueCr: 380, status: "Increased" },
      { company: "J Kumar Infraprojects", sector: "Infrastructure", jun25: 1.88, aug25: 1.88, sep25: 1.88, dec25: 2.02, mar26: 2.02, valueCr: 320, status: "Increased" },
      { company: "Techno Electric", sector: "Industrials", jun25: 1.74, aug25: 1.74, sep25: 1.60, dec25: 1.60, mar26: 1.42, valueCr: 290, status: "Reduced" },
      { company: "Cupid", sector: "Healthcare", jun25: 3.04, aug25: 3.04, sep25: 3.04, dec25: 3.04, mar26: 3.04, valueCr: 260, status: "Unchanged" }
    ]
  },
  {
    id: "nemish-shah",
    name: "Nemish Shah",
    initials: "NS",
    fund: "ENAM Asset Circle",
    type: "Fund",
    worthCr: 15210,
    holdingsCount: 25,
    sectorFocus: ["Technology", "Financials", "Industrials"],
    activity: "Low",
    description: "Institutional-style portfolio with disciplined exposure across scalable technology, financial, and industrial franchises.",
    bio: "A steadier disclosure profile with high-quality public market positions and relatively modest quarterly turnover.",
    activeSince: "1997",
    style: "Institutional quality growth",
    concentration: "Medium",
    keySectors: "Technology, Financials, Industrials",
    kpis: [
      { label: "Total Portfolio Value", value: "₹15,210 Cr", note: "Latest market value estimate" },
      { label: "Active Holdings", value: "25", note: "Disclosed live positions" },
      { label: "New Additions", value: "01", note: "Positions initiated this quarter" },
      { label: "Increased Stakes", value: "02", note: "Meaningful ownership increases" },
      { label: "Reduced Stakes", value: "02", note: "Portfolio trims" },
      { label: "Exits / Inactive", value: "01", note: "Exited or filing due" }
    ],
    topHoldings: [
      { company: "LTIMindtree", sector: "Technology", value: "₹3,640 Cr" },
      { company: "SBI Cards", sector: "Financials", value: "₹2,480 Cr" },
      { company: "AIA Engineering", sector: "Industrials", value: "₹1,910 Cr" },
      { company: "Persistent Systems", sector: "Technology", value: "₹1,720 Cr" }
    ],
    sectorAllocation: [
      { sector: "Technology", value: 34, amount: "₹5,171 Cr", color: "#173a69" },
      { sector: "Financials", value: 24, amount: "₹3,650 Cr", color: "#1f5ea8" },
      { sector: "Industrials", value: 21, amount: "₹3,194 Cr", color: "#317a85" },
      { sector: "Healthcare", value: 11, amount: "₹1,673 Cr", color: "#5d7392" },
      { sector: "Others", value: 10, amount: "₹1,522 Cr", color: "#9db0c8" }
    ],
    timeline: [
      { date: "08 Apr 2026", title: "Fresh filing in Max Financial", body: "New financial-services position initiated at 1.01%." },
      { date: "28 Mar 2026", title: "Trimmed LTIMindtree", body: "Minor trim after a sharp technology rally." },
      { date: "15 Mar 2026", title: "Raised AIA Engineering", body: "Increase supports continued confidence in industrial exports." }
    ],
    concentrationSummary: {
      title: "Top 5 holdings account for 58% of portfolio value",
      body: "The portfolio is balanced enough to look institutional, but still concentrated enough for each top position to matter.",
      topFive: 58,
      topTen: 77
    },
    themeSummary: {
      title: "Measured quality-first exposure",
      body: "This book reads as deliberately curated rather than opportunistic, with low turnover and a preference for scalable, durable operators."
    },
    notes: [
      { title: "Watch item", body: "Monitor whether the new financial-services position is scaled up across future filings." },
      { title: "Research angle", body: "Cross-reference technology trims against relative valuation and broader sector weight." },
      { title: "Behavior", body: "Low change velocity makes this profile useful as a stability benchmark in compare mode." }
    ],
    holdings: [
      { company: "LTIMindtree", sector: "Technology", jun25: 1.96, aug25: 1.96, sep25: 1.96, dec25: 1.84, mar26: 1.76, valueCr: 3640, status: "Reduced" },
      { company: "SBI Cards", sector: "Financials", jun25: 1.84, aug25: 1.84, sep25: 1.84, dec25: 1.84, mar26: 1.84, valueCr: 2480, status: "Unchanged" },
      { company: "AIA Engineering", sector: "Industrials", jun25: 1.21, aug25: 1.21, sep25: 1.21, dec25: 1.34, mar26: 1.46, valueCr: 1910, status: "Increased" },
      { company: "Persistent Systems", sector: "Technology", jun25: 0.94, aug25: 0.94, sep25: 0.94, dec25: 0.94, mar26: 0.94, valueCr: 1720, status: "Unchanged" },
      { company: "Max Financial", sector: "Financials", jun25: null, aug25: null, sep25: null, dec25: null, mar26: 1.01, valueCr: 690, status: "New" },
      { company: "Divi's Labs", sector: "Healthcare", jun25: 0.41, aug25: 0.41, sep25: 0.41, dec25: 0.41, mar26: 0.41, valueCr: 780, status: "Unchanged" },
      { company: "Coforge", sector: "Technology", jun25: 0.78, aug25: 0.78, sep25: 0.78, dec25: 0.74, mar26: 0.74, valueCr: 920, status: "Reduced" },
      { company: "SKF India", sector: "Industrials", jun25: 0.66, aug25: 0.66, sep25: 0.73, dec25: 0.81, mar26: 0.81, valueCr: 620, status: "Increased" },
      { company: "Laurus Labs", sector: "Healthcare", jun25: 0.92, aug25: 0.92, sep25: 0.92, dec25: 0.92, mar26: null, valueCr: 0, status: "Exited" },
      { company: "ICICI Lombard", sector: "Financials", jun25: 0.51, aug25: 0.51, sep25: 0.51, dec25: 0.51, mar26: 0.51, valueCr: 540, status: "Unchanged" }
    ]
  }
];

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
  selectedInvestorId: investors[0].id,
  compareIds: [investors[0].id, investors[1].id],
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
  sector: ["All Sectors", ...new Set(investors.flatMap((investor) => investor.sectorFocus))],
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
      investor.name.toLowerCase().includes(search) ||
      investor.fund.toLowerCase().includes(search) ||
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
        return a.name.localeCompare(b.name);
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
          <h3 class="investor-card__name">${investor.name}</h3>
          <strong>${investor.fund}</strong>
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
    <strong>${investor.name}</strong>
    <p>${investor.fund}</p>
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
  state.selectedInvestorId = investor.id;

  profileEls.title.textContent = investor.name;
  profileEls.fund.textContent = investor.fund;
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
              <strong>${investor.name}</strong>
              <div class="mini-list__sub">${investor.fund}</div>
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
};

const AGENTS_STORAGE_KEY = "muns_agents_v2";
const AGENT_SESSIONS_KEY = "muns_agent_sessions_v2";

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
}

function openAgentsView() {
  directoryView.classList.remove("is-active");
  profileView.classList.remove("is-active");
  agentEls.view.classList.add("is-active");
  agentEls.tabstripPanel.style.display = "block";
  renderAgentsTabs();
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

  agentEls.tabstrip.querySelectorAll("[data-agent-id]").forEach((btn) => {
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
    agentEls.output.innerHTML = `<p style="color: var(--danger);">${session.error}</p>`;
  } else if (session.markdown) {
    agentEls.output.innerHTML = `<div class="agents-markdown">${escapeHtml(session.markdown)}</div>`;
  } else {
    agentEls.output.innerHTML = "<p class='agents-output-empty'>Run the agent to load output.</p>";
  }

  agentEls.runPanel.hidden = false;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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
      const token = (import.meta?.env?.VITE_MUNS_ACCESS_TOKEN || "").trim();
      if (!token) {
        throw new Error("Missing MUNS_ACCESS_TOKEN.");
      }

      const response = await fetch("https://devde.muns.io/agents/run", {
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

      const markdown = raw
        .split("\n")
        .filter((line) => !line.match(/^(WriteTodos|NewsSearch|WebSearch|WebReader|DocumentFetch|PythonRepl|GetAnnouncements|HTTP\/\d|server:|date:|content-type:|x-powered-by:|access-control|x-request-id:|x-ratelimit|cache-control:|x-active-analyst-id:|x-analyst-output-id:|access-control-expose)/i))
        .filter((line) => !line.match(/^H4sI[A-Za-z0-9+/=]+$|H4sI[A-Za-z0-9+/=]{120,}|^[A-Za-z0-9+/]{200,}={0,2}$/))
        .filter(Boolean)
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      patchAgentSession(agent.id, {
        markdown,
        error: null,
        activeAnalystId: response.headers.get("x-active-analyst-id") || null,
        analystOutputId: response.headers.get("x-analyst-output-id") || null,
      });

      renderAgentPanel(agent.id);
    } catch (err) {
      patchAgentSession(agent.id, { error: err.message });
      renderAgentPanel(agent.id);
    } finally {
      agentEls.runButton.disabled = false;
      agentEls.runButton.textContent = "Run";
    }
  });
}

function init() {
  populateDirectoryFilters();
  setupTabs();
  attachGlobalEvents();
  loadAgents();
  setupAgentsEvents();
  syncGlobalSearch();
  renderDirectory();
  renderProfile(state.selectedInvestorId);
}

init();
