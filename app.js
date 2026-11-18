/**
 * MiniGoogle: Keyword Search (Old Way) vs PageRank (New Way)
 * Demonstrating the 1998 paradigm shift in web search.
 * Includes dynamic in-memory fake page injection (volatile, no persistent storage).
 */

// 1. Immutable original 6 pages
const ORIGINAL_PAGES = [
  {
    id: 1,
    url: "pune-food-guide.com",
    title: "Pune Food Guide - Local Eats, Street Food & Restaurants",
    text: "Where to eat in Pune - vada pav and biryani and pizza",
    outgoing: [2],
    category: "Editorial Guide"
  },
  {
    id: 2,
    url: "best-pizza-pune.com",
    title: "Best Pizza in Pune - Artisan Wood-Fired Pizzeria",
    text: "Fresh wood-fired pizza made daily - try our cheese pizza",
    outgoing: [1, 3],
    category: "Restaurant"
  },
  {
    id: 3,
    url: "college-canteen-blog.com",
    title: "Campus Bites Blog - Student Food Reviews",
    text: "Student reviews of canteen food and chai and Friday pizza",
    outgoing: [2, 4],
    category: "Student Blog"
  },
  {
    id: 4,
    url: "pizza-recipes-home.com",
    title: "Homemade Pizza Masterclass - Dough & Sauce Recipes",
    text: "Make pizza at home - pizza dough and pizza sauce",
    outgoing: [2, 5],
    category: "Recipe Blog"
  },
  {
    id: 5,
    url: "cheap-eats-pune.com",
    title: "Pune Budget Dining - Top Meals Under 100 Rs",
    text: "Good food under 100 rupees - misal and dosa and pizza slices",
    outgoing: [2],
    category: "Budget Guide"
  },
  {
    id: 6,
    url: "pizza-pizza-pizza.com",
    title: "PIZZA PIZZA PIZZA - Cheesy Slices Online",
    text: "pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza",
    outgoing: [1],
    category: "Keyword Spammer"
  }
];

// 2. Working in-memory pages list (NEVER saved to localStorage / disk)
let currentPages = JSON.parse(JSON.stringify(ORIGINAL_PAGES));
let pageRanks = {};
let inboundLinks = {};
let currentSearchQuery = "pizza";

// 3. Compute PageRank iteratively (d = 0.85, 100 iterations)
function computePageRank(pages, damping = 0.85, iterations = 100) {
  const N = pages.length;
  let ranks = {};
  
  // Initialize uniform probability 1/N
  pages.forEach(p => { ranks[p.id] = 1.0 / N; });

  // Map inbound citations
  const inLinks = {};
  pages.forEach(p => { inLinks[p.id] = []; });
  pages.forEach(p => {
    (p.outgoing || []).forEach(targetId => {
      if (inLinks[targetId]) inLinks[targetId].push(p.id);
    });
  });

  // Power iteration
  for (let it = 0; it < iterations; it++) {
    const nextRanks = {};
    pages.forEach(p => {
      let inboundSum = 0;
      const callers = inLinks[p.id] || [];
      callers.forEach(srcId => {
        const srcPage = pages.find(item => item.id === srcId);
        if (srcPage && srcPage.outgoing && srcPage.outgoing.length > 0) {
          inboundSum += ranks[srcId] / srcPage.outgoing.length;
        }
      });
      nextRanks[p.id] = ((1 - damping) / N) + (damping * inboundSum);
    });
    ranks = nextRanks;
  }

  return { ranks, inLinks };
}

// 4. Recompute ranks and update all views
function refreshEngine() {
  const result = computePageRank(currentPages);
  pageRanks = result.ranks;
  inboundLinks = result.inLinks;

  // Update Graph title
  const graphTitle = document.getElementById("graph-title");
  if (graphTitle) {
    graphTitle.textContent = `Web Graph & Inbound Citations (${currentPages.length} Pages)`;
  }

  // Update reset button visibility
  const resetBtn = document.getElementById("reset-pages-btn");
  if (resetBtn) {
    resetBtn.style.display = currentPages.length > ORIGINAL_PAGES.length ? "inline-block" : "none";
  }

  renderGraphPanel();
  executeSearch(currentSearchQuery);
}

// 5. Count occurrences of query term in a text
function countOccurrences(text, query) {
  if (!query || !query.trim() || !text) return 0;
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let total = 0;
  const lower = text.toLowerCase();
  terms.forEach(term => {
    const regex = new RegExp(`\\b${escapeRegExp(term)}`, "gi");
    const matches = lower.match(regex);
    if (matches) total += matches.length;
  });
  return total;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 6. Highlight matching keywords in text
function highlightKeywords(text, query) {
  if (!query || !query.trim() || !text) return escapeHtml(text || "");
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let safeText = escapeHtml(text);
  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
    safeText = safeText.replace(regex, `<mark class="highlight">$1</mark>`);
  });
  return safeText;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// 7. Build Graph Nodes Panel
function renderGraphPanel() {
  const container = document.getElementById("graph-grid");
  if (!container) return;
  container.innerHTML = "";

  currentPages.forEach(page => {
    const pr = pageRanks[page.id] || 0;
    const inCount = (inboundLinks[page.id] || []).length;
    const inList = (inboundLinks[page.id] || []).join(", ") || "None";
    const outList = (page.outgoing || []).join(", ") || "None";

    const box = document.createElement("div");
    box.className = "node-box";
    if (page.id === 2) box.classList.add("highlighted-hub");
    if (page.id === 6 || (page.isFake && inCount === 0)) box.classList.add("highlighted-spam");

    box.innerHTML = `
      <div class="node-id">
        <span>Page ${page.id}${page.isFake ? ' <small style="color:#ab47bc;">(Fake)</small>' : ''}</span>
        <span>${(pr * 100).toFixed(1)}%</span>
      </div>
      <div class="node-url">${escapeHtml(page.url)}</div>
      <div class="node-stat"><span>Inbound:</span> <strong>${inCount} (from [${inList}])</strong></div>
      <div class="node-stat"><span>Outbound:</span> <strong>to [${outList}]</strong></div>
      <div class="node-stat"><span>PageRank:</span> <strong>${pr.toFixed(4)}</strong></div>
    `;
    container.appendChild(box);
  });
}

// 8. Perform Search & Render Both Columns
function executeSearch(query) {
  currentSearchQuery = query;
  const trimmed = query.trim();
  const searchInput = document.getElementById("search-input");
  if (searchInput && searchInput.value !== trimmed) {
    searchInput.value = trimmed;
  }

  const clearBtn = document.getElementById("clear-btn");
  if (clearBtn) {
    clearBtn.classList.toggle("visible", trimmed.length > 0);
  }

  // Update pill active state
  document.querySelectorAll(".pill[data-query]").forEach(pill => {
    pill.classList.toggle("active", pill.dataset.query.toLowerCase() === trimmed.toLowerCase());
  });

  // Calculate scores for all pages
  const evaluated = currentPages.map(page => {
    const urlMatches = countOccurrences(page.url, trimmed);
    const textMatches = countOccurrences(page.text, trimmed);
    const titleMatches = countOccurrences(page.title || "", trimmed);
    const totalTf = urlMatches + textMatches + titleMatches;
    const pr = pageRanks[page.id] || 0;
    const inCount = (inboundLinks[page.id] || []).length;

    return {
      ...page,
      tf: totalTf,
      textTf: textMatches,
      pr: pr,
      inCount: inCount,
      combinedScore: totalTf * pr
    };
  });

  // Filter: only show pages that match query
  const matching = trimmed.length === 0 
    ? evaluated 
    : evaluated.filter(p => p.tf > 0);

  // Sort Old Way: By Term Frequency descending
  const oldWayResults = [...matching].sort((a, b) => {
    if (b.tf !== a.tf) return b.tf - a.tf;
    return a.id - b.id;
  });

  // Sort New Way: By PageRank descending (among matching documents)
  const newWayResults = [...matching].sort((a, b) => {
    if (b.pr !== a.pr) return b.pr - a.pr;
    return b.tf - a.tf;
  });

  // Render both columns
  renderResultsColumn("old", oldWayResults, trimmed);
  renderResultsColumn("new", newWayResults, trimmed);

  // Animate with GSAP if available
  animateCards();
}

function renderResultsColumn(type, results, query) {
  const container = document.getElementById(`${type}-results-list`);
  const countEl = document.getElementById(`${type}-result-count`);
  if (!container || !countEl) return;
  container.innerHTML = "";

  countEl.textContent = `${results.length} page${results.length === 1 ? '' : 's'} found`;

  if (results.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <p>No pages matched the query "<strong>${escapeHtml(query)}</strong>".</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Try searching for <code>pizza</code>, <code>pune</code>, or add a fake page.</p>
      </div>
    `;
    return;
  }

  results.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "result-card";
    
    // Tag spam or top quality for visual emphasis
    if (item.isFake) card.classList.add("is-fake-page");
    if (item.id === 6 && type === "old") card.classList.add("is-spam");
    if (item.id === 2 && type === "new" && index === 0) card.classList.add("is-top-quality");

    const highlightedTitle = highlightKeywords(item.title || item.url, query);
    const highlightedSnippet = highlightKeywords(item.text, query);
    const highlightedUrl = highlightKeywords(item.url, query);

    let metricsHtml = "";
    if (type === "old") {
      const isSpam = item.id === 6 || (item.tf > 8 && item.inCount === 0);
      metricsHtml = `
        <span class="metric-pill ${isSpam ? 'alert' : ''}">
          Keyword Count: ${item.tf}
        </span>
        ${isSpam ? '<span class="metric-sub alert">🚨 High keyword density</span>' : ''}
        ${item.isFake ? '<span class="metric-sub" style="color:#ab47bc; font-weight:600;">[Fake Page]</span>' : ''}
        <span class="metric-sub">Doc ID: ${item.id}</span>
      `;
    } else {
      const isWinner = item.id === 2 && index === 0;
      metricsHtml = `
        <span class="metric-pill ${isWinner ? 'success' : ''}">
          PageRank: ${(item.pr * 100).toFixed(1)}% (${item.pr.toFixed(4)})
        </span>
        <span class="metric-pill">
          Inbound Links: ${item.inCount}
        </span>
        ${isWinner ? '<span class="metric-sub success">🏆 Top Authority in graph</span>' : ''}
        ${item.inCount === 0 ? '<span class="metric-sub alert">0 Inbound Links (Untrusted)</span>' : ''}
        ${item.isFake ? '<span class="metric-sub" style="color:#ab47bc; font-weight:600;">[Fake Page]</span>' : ''}
      `;
    }

    card.innerHTML = `
      <div class="card-top">
        <span class="card-url">${highlightedUrl}</span>
        <span class="card-rank">#${index + 1}</span>
      </div>
      <a href="#page-${item.id}" class="card-title">${highlightedTitle}</a>
      <p class="card-snippet">${highlightedSnippet}</p>
      <div class="card-metrics">
        ${metricsHtml}
      </div>
    `;

    container.appendChild(card);
  });
}

// 9. GSAP Animation with fallback
function animateCards() {
  if (typeof gsap !== "undefined" && gsap.from) {
    gsap.from(".result-card", {
      opacity: 0,
      y: 10,
      duration: 0.35,
      stagger: 0.05,
      ease: "power2.out",
      clearProps: "all"
    });
  }
}

// 10. Add Fake Page Handler (In-Memory Only, Never Saved)
function addFakePage(url, text, outgoingIdsStr) {
  const nextId = currentPages.length + 1;
  const outgoing = outgoingIdsStr
    ? outgoingIdsStr
        .split(/[,;\s]+/)
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && currentPages.some(p => p.id === n))
    : [];

  const newPage = {
    id: nextId,
    url: url.trim() || `fake-site-${nextId}.com`,
    title: `${url.trim()} (Simulated Page #${nextId})`,
    text: text.trim(),
    outgoing: outgoing,
    category: "User Added (Fake)",
    isFake: true
  };

  currentPages.push(newPage);
  refreshEngine();
}

// 11. Event Listeners Setup
function initApp() {
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const clearBtn = document.getElementById("clear-btn");
  const toggleGraphBtn = document.getElementById("toggle-graph-btn");
  const graphPanel = document.getElementById("graph-panel");

  const toggleFakeBtn = document.getElementById("toggle-fake-panel-btn");
  const fakePanel = document.getElementById("fake-page-panel");
  const closeFakeBtn = document.getElementById("close-fake-panel-btn");
  const fakeForm = document.getElementById("fake-page-form");
  const resetBtn = document.getElementById("reset-pages-btn");

  // Presets
  const presetSpam = document.getElementById("preset-spam");
  const presetAuthority = document.getElementById("preset-authority");
  const presetCanteen = document.getElementById("preset-canteen");

  // Initial calculation
  refreshEngine();

  // Search input events
  searchInput.addEventListener("input", (e) => {
    executeSearch(e.target.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      executeSearch(searchInput.value);
    }
  });

  searchBtn.addEventListener("click", () => {
    executeSearch(searchInput.value);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    executeSearch("");
  });

  // Query Pills
  document.querySelectorAll(".pill[data-query]").forEach(pill => {
    pill.addEventListener("click", () => {
      const q = pill.dataset.query;
      executeSearch(q);
    });
  });

  // Toggle Graph
  toggleGraphBtn.addEventListener("click", () => {
    graphPanel.classList.toggle("open");
    toggleGraphBtn.classList.toggle("active", graphPanel.classList.contains("open"));
  });

  // Toggle Fake Panel
  toggleFakeBtn.addEventListener("click", () => {
    fakePanel.classList.toggle("open");
    toggleFakeBtn.classList.toggle("active", fakePanel.classList.contains("open"));
  });

  closeFakeBtn.addEventListener("click", () => {
    fakePanel.classList.remove("open");
    toggleFakeBtn.classList.remove("active");
  });

  // Form Submit
  fakeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = document.getElementById("fake-url").value;
    const text = document.getElementById("fake-text").value;
    const outgoing = document.getElementById("fake-outgoing").value;
    addFakePage(url, text, outgoing);
    fakeForm.reset();
    fakePanel.classList.remove("open");
    toggleFakeBtn.classList.remove("active");
  });

  // Quick Preset 1: 20x Pizza Spammer
  presetSpam.addEventListener("click", () => {
    addFakePage(
      "super-spam-pizza-palace.com",
      "pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza",
      ""
    );
    fakePanel.classList.remove("open");
    toggleFakeBtn.classList.remove("active");
  });

  // Quick Preset 2: Authority Site Linking to Page 2
  presetAuthority.addEventListener("click", () => {
    addFakePage(
      "michelin-guide-pune.com",
      "Award winning pizza and Italian cuisine in Pune - our top recommendation is best pizza pune",
      "2"
    );
    fakePanel.classList.remove("open");
    toggleFakeBtn.classList.remove("active");
  });

  // Quick Preset 3: Pune Chai Stall
  presetCanteen.addEventListener("click", () => {
    addFakePage(
      "vada-pav-express-pune.com",
      "Best street vada pav samosa and Friday afternoon pizza in Pune",
      "1, 3"
    );
    fakePanel.classList.remove("open");
    toggleFakeBtn.classList.remove("active");
  });

  // Reset Button (Reverts in-memory data to original 6)
  resetBtn.addEventListener("click", () => {
    currentPages = JSON.parse(JSON.stringify(ORIGINAL_PAGES));
    refreshEngine();
  });
}

document.addEventListener("DOMContentLoaded", initApp);
