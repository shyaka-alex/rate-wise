/**
 * Rate Wise — Express backend
 * Proxies ExchangeRate-API v6 so the API key never reaches the browser.
 */

require("dotenv").config();

const express = require("express");
const path = require("path");
const os = require("os");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.API_KEY;
const API_BASE = "https://v6.exchangerate-api.com/v6";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_AMOUNT = 1_000_000_000;

const CACHE_TTL = {
  codes: 24 * 60 * 60 * 1000, // 24 hours
  rates: 60 * 60 * 1000, // 1 hour
};

/** @type {Map<string, { expires: number, data: unknown }>} */
const cache = new Map();

/** Supported currency codes, refreshed from /codes (and cache). */
let supportedCodes = new Set();

if (!API_KEY) {
  console.warn(
    "[Rate Wise] WARNING: API_KEY is missing. Set it in .env before making API requests."
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use((req, res, next) => {
  res.setHeader("X-Served-By", os.hostname());
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttlMs) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

function isValidCurrencyCode(code) {
  return typeof code === "string" && /^[A-Z]{3}$/.test(code);
}

function parseAmount(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_AMOUNT) return null;
  return n;
}

/**
 * Map ExchangeRate-API error types to HTTP status + user-friendly message.
 */
function mapApiError(errorType) {
  switch (errorType) {
    case "invalid-key":
      return {
        status: 503,
        message: "Currency service is misconfigured. Please try again later.",
      };
    case "quota-reached":
      return {
        status: 503,
        message: "Currency service quota reached. Please try again later.",
      };
    case "unsupported-code":
      return {
        status: 400,
        message: "That currency code is not supported.",
      };
    case "malformed-request":
      return {
        status: 400,
        message: "Invalid request to the currency service.",
      };
    default:
      return {
        status: 502,
        message: "Currency service returned an unexpected error.",
      };
  }
}

/**
 * Fetch JSON from ExchangeRate-API with timeout and structured error handling.
 * Never logs or returns the API key.
 */
async function fetchFromApi(urlPath) {
  if (!API_KEY) {
    const err = new Error(
      "Currency service is unavailable. API key is not configured."
    );
    err.status = 503;
    throw err;
  }

  const url = `${API_BASE}/${API_KEY}${urlPath}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    let body;
    try {
      body = await response.json();
    } catch {
      const err = new Error("Currency service returned an invalid response.");
      err.status = 502;
      throw err;
    }

    if (!response.ok) {
      const mapped = mapApiError(body && body["error-type"]);
      const err = new Error(mapped.message);
      err.status = mapped.status;
      throw err;
    }

    if (body.result === "error") {
      const mapped = mapApiError(body["error-type"]);
      const err = new Error(mapped.message);
      err.status = mapped.status;
      throw err;
    }

    return body;
  } catch (error) {
    if (error.status) throw error;

    if (error.name === "AbortError") {
      const err = new Error(
        "Currency service timed out. Please try again."
      );
      err.status = 504;
      throw err;
    }

    const err = new Error(
      "Could not reach the currency service. Check your connection and try again."
    );
    err.status = 502;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function loadSupportedCodes(forceRefresh = false) {
  const cacheKey = "codes";
  if (!forceRefresh) {
    const cached = getCache(cacheKey);
    if (cached) {
      supportedCodes = new Set(cached.supported_codes.map(([code]) => code));
      return { data: cached, fromCache: true };
    }
  }

  const body = await fetchFromApi("/codes");
  const supported_codes = body.supported_codes || [];
  const payload = { supported_codes };
  setCache(cacheKey, payload, CACHE_TTL.codes);
  supportedCodes = new Set(supported_codes.map(([code]) => code));
  return { data: payload, fromCache: false };
}

function ensureCodeSupported(code) {
  if (!isValidCurrencyCode(code)) {
    const err = new Error(
      "Currency codes must be exactly 3 uppercase letters (e.g. USD)."
    );
    err.status = 400;
    throw err;
  }
  if (supportedCodes.size > 0 && !supportedCodes.has(code)) {
    const err = new Error(`Currency code "${code}" is not supported.`);
    err.status = 400;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({ status: "ok", server: os.hostname() });
});

app.get("/api/codes", async (req, res) => {
  try {
    const { data, fromCache } = await loadSupportedCodes();
    res.json({
      supported_codes: data.supported_codes,
      cached: fromCache,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to load currency codes.",
    });
  }
});

app.get("/api/rates/:base", async (req, res) => {
  try {
    const base = String(req.params.base || "").toUpperCase();

    // Ensure we have a codes list for validation when possible
    if (supportedCodes.size === 0) {
      try {
        await loadSupportedCodes();
      } catch {
        // Continue; validation will still check format
      }
    }

    ensureCodeSupported(base);

    const cacheKey = `rates:${base}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const body = await fetchFromApi(`/latest/${base}`);
    const payload = {
      base_code: body.base_code,
      time_last_update_utc: body.time_last_update_utc,
      conversion_rates: body.conversion_rates,
    };
    setCache(cacheKey, payload, CACHE_TTL.rates);
    res.json({ ...payload, cached: false });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Failed to load exchange rates.",
    });
  }
});

app.get("/api/convert", async (req, res) => {
  try {
    const from = String(req.query.from || "").toUpperCase();
    const to = String(req.query.to || "").toUpperCase();
    const amount = parseAmount(req.query.amount);

    if (supportedCodes.size === 0) {
      try {
        await loadSupportedCodes();
      } catch {
        // Continue with format validation
      }
    }

    ensureCodeSupported(from);
    ensureCodeSupported(to);

    if (amount === null) {
      return res.status(400).json({
        error: `Amount must be a positive number up to ${MAX_AMOUNT.toLocaleString("en-US")}.`,
      });
    }

    const body = await fetchFromApi(`/pair/${from}/${to}/${amount}`);
    res.json({
      from,
      to,
      amount,
      conversion_rate: body.conversion_rate,
      conversion_result: body.conversion_result,
      time_last_update_utc: body.time_last_update_utc,
      cached: false,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Conversion failed.",
    });
  }
});

// SPA-friendly fallback: unknown non-API routes get index.html
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found." });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"), (err) => {
    if (err) next(err);
  });
});

// Global error handler — never crash on unexpected errors
app.use((err, req, res, next) => {
  console.error("[Rate Wise] Unhandled error:", err.message);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`Rate Wise listening on http://localhost:${PORT}`);
  console.log(`Served by host: ${os.hostname()}`);
});
