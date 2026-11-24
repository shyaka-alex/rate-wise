/**
 * Rate Wise — frontend
 * All ExchangeRate-API traffic goes through our Express backend.
 * Use textContent (not innerHTML) for API/user data to avoid XSS.
 */

(() => {
  "use strict";

  const POPULAR = [
    "USD",
    "EUR",
    "GBP",
    "RWF",
    "KES",
    "UGX",
    "NGN",
    "ZAR",
    "JPY",
    "CNY",
  ];

  const SPOTLIGHT_CODES = ["EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "RWF", "KES"];

  const FLAG_OVERRIDES = {
    EUR: "🇪🇺",
    GBP: "🇬🇧",
    XOF: "🌍",
    XAF: "🌍",
    XCD: "🌎",
    XPF: "🌏",
    ANG: "🇨🇼",
    AWG: "🇦🇼",
  };

  /** Hardcoded code → region map for filtering. */
  const REGION_MAP = {
    DZD: "Africa",
    AOA: "Africa",
    XOF: "Africa",
    BWP: "Africa",
    BIF: "Africa",
    CVE: "Africa",
    XAF: "Africa",
    KMF: "Africa",
    CDF: "Africa",
    DJF: "Africa",
    EGP: "Africa",
    ERN: "Africa",
    SZL: "Africa",
    ETB: "Africa",
    GMD: "Africa",
    GHS: "Africa",
    GNF: "Africa",
    KES: "Africa",
    LSL: "Africa",
    LRD: "Africa",
    LYD: "Africa",
    MGA: "Africa",
    MWK: "Africa",
    MRU: "Africa",
    MUR: "Africa",
    MAD: "Africa",
    MZN: "Africa",
    NAD: "Africa",
    NGN: "Africa",
    RWF: "Africa",
    STN: "Africa",
    SCR: "Africa",
    SLL: "Africa",
    SOS: "Africa",
    ZAR: "Africa",
    SSP: "Africa",
    SDG: "Africa",
    TZS: "Africa",
    TND: "Africa",
    UGX: "Africa",
    ZMW: "Africa",
    ZWL: "Africa",
    ALL: "Europe",
    EUR: "Europe",
    AMD: "Europe",
    AZN: "Europe",
    BYN: "Europe",
    BAM: "Europe",
    BGN: "Europe",
    HRK: "Europe",
    CZK: "Europe",
    DKK: "Europe",
    GEL: "Europe",
    GIP: "Europe",
    HUF: "Europe",
    ISK: "Europe",
    CHF: "Europe",
    MDL: "Europe",
    MKD: "Europe",
    NOK: "Europe",
    PLN: "Europe",
    RON: "Europe",
    RUB: "Europe",
    RSD: "Europe",
    SEK: "Europe",
    TRY: "Europe",
    UAH: "Europe",
    GBP: "Europe",
    AFN: "Asia",
    BDT: "Asia",
    BTN: "Asia",
    BND: "Asia",
    KHR: "Asia",
    CNY: "Asia",
    HKD: "Asia",
    INR: "Asia",
    IDR: "Asia",
    JPY: "Asia",
    KZT: "Asia",
    KGS: "Asia",
    LAK: "Asia",
    MOP: "Asia",
    MYR: "Asia",
    MVR: "Asia",
    MNT: "Asia",
    MMK: "Asia",
    NPR: "Asia",
    KPW: "Asia",
    PKR: "Asia",
    PHP: "Asia",
    SGD: "Asia",
    KRW: "Asia",
    LKR: "Asia",
    TWD: "Asia",
    TJS: "Asia",
    THB: "Asia",
    TMT: "Asia",
    UZS: "Asia",
    VND: "Asia",
    USD: "Americas",
    CAD: "Americas",
    MXN: "Americas",
    BRL: "Americas",
    ARS: "Americas",
    BOB: "Americas",
    CLP: "Americas",
    COP: "Americas",
    CRC: "Americas",
    CUP: "Americas",
    DOP: "Americas",
    XCD: "Americas",
    GTQ: "Americas",
    GYD: "Americas",
    HTG: "Americas",
    HNL: "Americas",
    JMD: "Americas",
    NIO: "Americas",
    PAB: "Americas",
    PYG: "Americas",
    PEN: "Americas",
    SRD: "Americas",
    TTD: "Americas",
    UYU: "Americas",
    VES: "Americas",
    BSD: "Americas",
    BBD: "Americas",
    BMD: "Americas",
    KYD: "Americas",
    AWG: "Americas",
    BZD: "Americas",
    BHD: "Middle East",
    IQD: "Middle East",
    ILS: "Middle East",
    JOD: "Middle East",
    KWD: "Middle East",
    LBP: "Middle East",
    OMR: "Middle East",
    QAR: "Middle East",
    SAR: "Middle East",
    SYP: "Middle East",
    AED: "Middle East",
    YER: "Middle East",
    IRR: "Middle East",
    AUD: "Oceania",
    NZD: "Oceania",
    FJD: "Oceania",
    PGK: "Oceania",
    WST: "Oceania",
    SBD: "Oceania",
    TOP: "Oceania",
    VUV: "Oceania",
    XPF: "Oceania",
  };

  const FAVORITES_KEY = "ratewise_favorites";

  const els = {
    globalError: document.getElementById("global-error"),
    globalErrorMessage: document.getElementById("global-error-message"),
    globalRetry: document.getElementById("global-retry"),
    amount: document.getElementById("amount"),
    fromSearch: document.getElementById("from-search"),
    fromCurrency: document.getElementById("from-currency"),
    toSearch: document.getElementById("to-search"),
    toCurrency: document.getElementById("to-currency"),
    fromFlag: document.getElementById("from-flag"),
    toFlag: document.getElementById("to-flag"),
    baseFlag: document.getElementById("base-flag"),
    swap: document.getElementById("swap-currencies"),
    convertForm: document.getElementById("convert-form"),
    convertBtn: document.getElementById("convert-btn"),
    convertBtnLabel: document.getElementById("convert-btn-label"),
    convertLoading: document.getElementById("convert-loading"),
    convertResult: document.getElementById("convert-result"),
    convertSummary: document.getElementById("convert-summary"),
    convertMeta: document.getElementById("convert-meta"),
    convertError: document.getElementById("convert-error"),
    convertErrorMessage: document.getElementById("convert-error-message"),
    convertRetry: document.getElementById("convert-retry"),
    convertTitle: document.getElementById("convert-title"),
    convertRateLine: document.getElementById("convert-rate-line"),
    convertedAmount: document.getElementById("converted-amount"),
    overviewBaseCode: document.getElementById("overview-base-code"),
    overviewValue: document.getElementById("overview-value"),
    overviewPairLabel: document.getElementById("overview-pair-label"),
    overviewCount: document.getElementById("overview-count"),
    spotlightBase: document.getElementById("spotlight-base"),
    spotlightList: document.getElementById("spotlight-list"),
    quickPicks: document.getElementById("quick-picks"),
    baseSearch: document.getElementById("base-search"),
    baseCurrency: document.getElementById("base-currency"),
    ratesSearch: document.getElementById("rates-search"),
    regionFilter: document.getElementById("region-filter"),
    favoritesOnly: document.getElementById("favorites-only"),
    ratesCount: document.getElementById("rates-count"),
    ratesLoading: document.getElementById("rates-loading"),
    ratesError: document.getElementById("rates-error"),
    ratesErrorMessage: document.getElementById("rates-error-message"),
    ratesRetry: document.getElementById("rates-retry"),
    ratesEmpty: document.getElementById("rates-empty"),
    clearFilters: document.getElementById("clear-filters"),
    ratesTable: document.getElementById("rates-table"),
    ratesTbody: document.getElementById("rates-tbody"),
    ratesUpdated: document.getElementById("rates-updated"),
    serverName: document.getElementById("server-name"),
    scrollToRates: document.getElementById("scroll-to-rates"),
    focusConverter: document.getElementById("focus-converter"),
    converterCard: document.getElementById("converter-card"),
    ratesSection: document.getElementById("rates-section"),
  };

  /** @type {Array<[string, string]>} */
  let codes = [];
  /** @type {Record<string, string>} */
  let nameByCode = {};
  /** @type {Array<{ code: string, name: string, rate: number }>} */
  let ratesRows = [];
  /** @type {Record<string, number>} */
  let latestRates = {};
  let lastUpdateUtc = "";
  let sortKey = "code";
  let sortDir = "asc";
  /** @type {Set<string>} */
  let favorites = loadFavorites();
  let convertTimer = null;

  const numberFmt = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
  });
  const amountFmt = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  });

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(
        Array.isArray(list) ? list.filter((c) => typeof c === "string") : []
      );
    } catch {
      return new Set();
    }
  }

  function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = hidden;
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function flagFor(code) {
    if (!code) return "🏳️";
    if (FLAG_OVERRIDES[code]) return FLAG_OVERRIDES[code];
    const cc = code.slice(0, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
    const A = 0x1f1e6;
    return String.fromCodePoint(
      A + cc.charCodeAt(0) - 65,
      A + cc.charCodeAt(1) - 65
    );
  }

  function updateFlags() {
    setText(els.fromFlag, flagFor(els.fromCurrency.value));
    setText(els.toFlag, flagFor(els.toCurrency.value));
    setText(els.baseFlag, flagFor(els.baseCurrency.value));
  }

  async function apiGet(path) {
    const response = await fetch(path, {
      headers: { Accept: "application/json" },
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      const message =
        (body && body.error) || `Request failed (${response.status}).`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }
    return body;
  }

  function fillSelect(selectEl, selected) {
    const previous = selected || selectEl.value;
    selectEl.textContent = "";
    for (const [code, name] of codes) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = `${code} — ${name}`;
      selectEl.appendChild(option);
    }
    if (previous && nameByCode[previous]) {
      selectEl.value = previous;
    }
  }

  function filterSelectOptions(selectEl, query) {
    const q = query.trim().toLowerCase();
    const options = [...selectEl.options];
    let firstVisible = null;
    for (const option of options) {
      const match =
        !q ||
        option.value.toLowerCase().includes(q) ||
        option.textContent.toLowerCase().includes(q);
      option.hidden = !match;
      if (match && !firstVisible) firstVisible = option.value;
    }
    if (firstVisible && selectEl.selectedOptions[0]?.hidden) {
      selectEl.value = firstVisible;
    }
  }

  function formatRate(value) {
    if (!Number.isFinite(value)) return "—";
    return numberFmt.format(value);
  }

  // -------------------------------------------------------------------------
  // Init / data loading
  // -------------------------------------------------------------------------

  async function loadCodes() {
    setHidden(els.globalError, true);
    const data = await apiGet("/api/codes");
    codes = Array.isArray(data.supported_codes) ? data.supported_codes : [];
    nameByCode = Object.fromEntries(codes);

    fillSelect(els.fromCurrency, "RWF");
    fillSelect(els.toCurrency, "UGX");
    fillSelect(els.baseCurrency, "USD");

    if (!nameByCode[els.fromCurrency.value] && codes[0]) {
      els.fromCurrency.value = codes[0][0];
    }
    if (!nameByCode[els.toCurrency.value] && codes[1]) {
      els.toCurrency.value = codes[1][0];
    }
    if (!nameByCode[els.baseCurrency.value] && codes[0]) {
      els.baseCurrency.value = codes[0][0];
    }

    updateFlags();
    updateConvertChrome();
    renderQuickPicks();
  }

  async function loadHealth() {
    try {
      const data = await apiGet("/health");
      setText(els.serverName, data.server || "unknown");
    } catch {
      setText(els.serverName, "unavailable");
    }
  }

  function renderQuickPicks() {
    els.quickPicks.textContent = "";
    for (const code of POPULAR) {
      if (!nameByCode[code]) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.dataset.code = code;
      btn.textContent = code;
      btn.title = nameByCode[code];
      btn.setAttribute(
        "aria-pressed",
        code === els.baseCurrency.value ? "true" : "false"
      );
      if (code === els.baseCurrency.value) btn.classList.add("active");
      btn.addEventListener("click", () => {
        els.baseCurrency.value = code;
        els.baseSearch.value = "";
        filterSelectOptions(els.baseCurrency, "");
        updateFlags();
        updateQuickPickActive();
        loadRates();
      });
      els.quickPicks.appendChild(btn);
    }
  }

  function updateQuickPickActive() {
    const current = els.baseCurrency.value;
    for (const btn of els.quickPicks.querySelectorAll(".chip")) {
      const active = btn.dataset.code === current;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function updateConvertChrome() {
    const from = els.fromCurrency.value || "USD";
    const to = els.toCurrency.value || "EUR";
    const amount = Number(els.amount.value);
    setText(els.convertTitle, `Convert ${from}`);
    setText(
      els.convertBtnLabel,
      Number.isFinite(amount) && amount > 0
        ? `Convert ${amountFmt.format(amount)} ${from}`
        : `Convert ${from}`
    );

    // Rate line is filled after convert / from overview rates if same base
    if (els.convertRateLine && !els.convertRateLine.dataset.locked) {
      setText(els.convertRateLine, `1 ${from} → ${to}`);
    }
  }

  // -------------------------------------------------------------------------
  // Overview + spotlight rates
  // -------------------------------------------------------------------------

  function updateOverview() {
    const base = els.baseCurrency.value || "USD";
    const compare =
      base === "EUR" ? "USD" : latestRates.EUR != null ? "EUR" : "USD";
    const rate = latestRates[compare];

    setText(els.overviewBaseCode, base);
    setText(
      els.overviewValue,
      Number.isFinite(rate)
        ? `${formatRate(rate)} ${compare}`
        : "—"
    );
    setText(els.overviewPairLabel, `vs ${compare}`);
    setText(
      els.overviewCount,
      `${ratesRows.length.toLocaleString()} currencies`
    );
    renderSpotlight();
  }

  function renderSpotlight() {
    const base = els.baseCurrency.value || "USD";
    setText(els.spotlightBase, base);
    els.spotlightList.textContent = "";

    const rows = SPOTLIGHT_CODES.filter(
      (code) => code !== base && Number.isFinite(latestRates[code])
    )
      .slice(0, 5)
      .map((code) => ({
        code,
        name: nameByCode[code] || code,
        rate: latestRates[code],
      }));

    if (rows.length === 0) {
      const empty = document.createElement("li");
      setText(empty, "Rates unavailable");
      els.spotlightList.appendChild(empty);
      return;
    }

    for (const row of rows) {
      const li = document.createElement("li");

      const left = document.createElement("span");
      left.className = "spotlight-code";
      const flag = document.createElement("span");
      flag.setAttribute("aria-hidden", "true");
      setText(flag, flagFor(row.code));
      const code = document.createElement("span");
      setText(code, row.code);
      const name = document.createElement("span");
      name.className = "spotlight-name";
      setText(name, row.name);
      left.append(flag, code, name);

      const rate = document.createElement("span");
      rate.className = "spotlight-rate";
      setText(rate, formatRate(row.rate));

      li.append(left, rate);
      els.spotlightList.appendChild(li);
    }
  }

  // -------------------------------------------------------------------------
  // Converter
  // -------------------------------------------------------------------------

  async function convertCurrency() {
    setHidden(els.convertError, true);
    setHidden(els.convertResult, true);
    setHidden(els.convertLoading, false);
    els.convertBtn.disabled = true;
    updateConvertChrome();

    const amount = Number(els.amount.value);
    const from = els.fromCurrency.value;
    const to = els.toCurrency.value;

    try {
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a positive amount to convert.");
      }

      const params = new URLSearchParams({
        from,
        to,
        amount: String(amount),
      });
      const data = await apiGet(`/api/convert?${params}`);

      setText(els.convertedAmount, amountFmt.format(data.conversion_result));
      setText(
        els.convertRateLine,
        `1 ${data.from} = ${formatRate(data.conversion_rate)} ${data.to}`
      );
      els.convertRateLine.dataset.locked = "1";

      setText(
        els.convertSummary,
        `${amountFmt.format(data.amount)} ${data.from} = ${amountFmt.format(data.conversion_result)} ${data.to}`
      );
      setText(
        els.convertMeta,
        data.time_last_update_utc
          ? `Updated ${data.time_last_update_utc}`
          : `Rate ${formatRate(data.conversion_rate)}`
      );
      setHidden(els.convertResult, false);
    } catch (error) {
      setText(els.convertedAmount, "—");
      setText(els.convertErrorMessage, error.message || "Conversion failed.");
      setHidden(els.convertError, false);
    } finally {
      setHidden(els.convertLoading, true);
      els.convertBtn.disabled = false;
      updateConvertChrome();
    }
  }

  function scheduleConvert() {
    clearTimeout(convertTimer);
    convertTimer = setTimeout(() => {
      convertCurrency();
    }, 350);
  }

  // -------------------------------------------------------------------------
  // Rates table
  // -------------------------------------------------------------------------

  async function loadRates() {
    setHidden(els.ratesError, true);
    setHidden(els.ratesEmpty, true);
    setHidden(els.ratesTable, true);
    setHidden(els.ratesLoading, false);
    setText(els.ratesUpdated, "");
    updateQuickPickActive();
    updateFlags();

    const base = els.baseCurrency.value;

    try {
      const data = await apiGet(`/api/rates/${encodeURIComponent(base)}`);
      const rates = data.conversion_rates || {};
      lastUpdateUtc = data.time_last_update_utc || "";
      latestRates = rates;

      ratesRows = Object.entries(rates)
        .filter(([code]) => code !== base)
        .map(([code, rate]) => ({
          code,
          name: nameByCode[code] || code,
          rate: Number(rate),
        }));

      updateOverview();
      renderRatesTable();
      setText(
        els.ratesUpdated,
        lastUpdateUtc
          ? `Rates last updated: ${lastUpdateUtc}${data.cached ? " (cached)" : ""}`
          : data.cached
            ? "Showing cached rates"
            : ""
      );
    } catch (error) {
      setText(els.ratesErrorMessage, error.message || "Failed to load rates.");
      setHidden(els.ratesError, false);
      setText(els.ratesCount, "");
    } finally {
      setHidden(els.ratesLoading, false);
    }
  }

  function getFilteredSortedRows() {
    const q = els.ratesSearch.value.trim().toLowerCase();
    const region = els.regionFilter.value;
    const favOnly = els.favoritesOnly.checked;

    let rows = ratesRows.filter((row) => {
      if (favOnly && !favorites.has(row.code)) return false;
      if (region !== "all" && REGION_MAP[row.code] !== region) return false;
      if (!q) return true;
      return (
        row.code.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q)
      );
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "rate") {
        cmp = a.rate - b.rate;
      } else {
        cmp = a.code.localeCompare(b.code);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }

  function updateSortIndicators() {
    for (const btn of document.querySelectorAll(".sort-btn")) {
      const key = btn.dataset.sort;
      const indicator = btn.querySelector(".sort-indicator");
      const active = key === sortKey;
      btn.classList.toggle("active", active);
      if (indicator) {
        indicator.textContent = active ? (sortDir === "asc" ? "↑" : "↓") : "";
      }
      btn.setAttribute(
        "aria-sort",
        active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      );
    }
  }

  function renderRatesTable() {
    const rows = getFilteredSortedRows();
    setText(
      els.ratesCount,
      `Showing ${rows.length} of ${ratesRows.length} currencies`
    );
    updateSortIndicators();

    els.ratesTbody.textContent = "";

    if (rows.length === 0) {
      setHidden(els.ratesTable, true);
      setHidden(els.ratesEmpty, true);
      if (ratesRows.length > 0) setHidden(els.ratesEmpty, false);
      return;
    }

    setHidden(els.ratesEmpty, true);
    setHidden(els.ratesTable, false);

    const fragment = document.createDocumentFragment();

    for (const row of rows) {
      const tr = document.createElement("tr");

      const favTd = document.createElement("td");
      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "fav-btn" + (favorites.has(row.code) ? " is-fav" : "");
      favBtn.setAttribute(
        "aria-label",
        favorites.has(row.code)
          ? `Remove ${row.code} from favorites`
          : `Add ${row.code} to favorites`
      );
      favBtn.setAttribute(
        "aria-pressed",
        favorites.has(row.code) ? "true" : "false"
      );
      favBtn.textContent = favorites.has(row.code) ? "★" : "☆";
      favBtn.addEventListener("click", () => toggleFavorite(row.code));
      favTd.appendChild(favBtn);

      const codeTd = document.createElement("td");
      codeTd.className = "code-cell";
      codeTd.textContent = `${flagFor(row.code)} ${row.code}`;

      const nameTd = document.createElement("td");
      nameTd.textContent = row.name;

      const rateTd = document.createElement("td");
      rateTd.className = "rate-cell";
      rateTd.textContent = formatRate(row.rate);

      tr.append(favTd, codeTd, nameTd, rateTd);
      fragment.appendChild(tr);
    }

    els.ratesTbody.appendChild(fragment);
  }

  function toggleFavorite(code) {
    if (favorites.has(code)) favorites.delete(code);
    else favorites.add(code);
    saveFavorites();
    renderRatesTable();
  }

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  els.convertForm.addEventListener("submit", (event) => {
    event.preventDefault();
    convertCurrency();
  });

  els.swap.addEventListener("click", () => {
    const from = els.fromCurrency.value;
    els.fromCurrency.value = els.toCurrency.value;
    els.toCurrency.value = from;
    els.fromSearch.value = "";
    els.toSearch.value = "";
    filterSelectOptions(els.fromCurrency, "");
    filterSelectOptions(els.toCurrency, "");
    delete els.convertRateLine.dataset.locked;
    updateFlags();
    updateConvertChrome();
    scheduleConvert();
  });

  els.convertRetry.addEventListener("click", convertCurrency);

  els.amount.addEventListener("input", () => {
    updateConvertChrome();
    scheduleConvert();
  });

  els.fromSearch.addEventListener("input", () => {
    filterSelectOptions(els.fromCurrency, els.fromSearch.value);
  });
  els.toSearch.addEventListener("input", () => {
    filterSelectOptions(els.toCurrency, els.toSearch.value);
  });
  els.baseSearch.addEventListener("input", () => {
    filterSelectOptions(els.baseCurrency, els.baseSearch.value);
  });

  els.fromCurrency.addEventListener("change", () => {
    delete els.convertRateLine.dataset.locked;
    updateFlags();
    updateConvertChrome();
    scheduleConvert();
  });
  els.toCurrency.addEventListener("change", () => {
    delete els.convertRateLine.dataset.locked;
    updateFlags();
    updateConvertChrome();
    scheduleConvert();
  });

  els.baseCurrency.addEventListener("change", () => {
    updateQuickPickActive();
    updateFlags();
    loadRates();
  });

  els.ratesSearch.addEventListener("input", renderRatesTable);
  els.regionFilter.addEventListener("change", renderRatesTable);
  els.favoritesOnly.addEventListener("change", renderRatesTable);

  els.clearFilters.addEventListener("click", () => {
    els.ratesSearch.value = "";
    els.regionFilter.value = "all";
    els.favoritesOnly.checked = false;
    renderRatesTable();
  });

  els.ratesRetry.addEventListener("click", loadRates);

  els.scrollToRates.addEventListener("click", () => {
    els.ratesSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.focusConverter.addEventListener("click", () => {
    els.converterCard.scrollIntoView({ behavior: "smooth", block: "center" });
    els.amount.focus();
  });

  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.sort;
      if (sortKey === key) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDir = "asc";
      }
      renderRatesTable();
    });
  });

  els.globalRetry.addEventListener("click", bootstrap);

  // -------------------------------------------------------------------------
  // Bootstrap
  // -------------------------------------------------------------------------

  async function bootstrap() {
    setHidden(els.globalError, true);
    try {
      await loadCodes();
      await Promise.all([loadRates(), loadHealth(), convertCurrency()]);
    } catch (error) {
      setText(
        els.globalErrorMessage,
        error.message || "Failed to initialize Rate Wise."
      );
      setHidden(els.globalError, false);
    }
  }

  bootstrap();
})();
