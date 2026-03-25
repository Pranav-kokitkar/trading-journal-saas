const { parse } = require("csv-parse/sync");

const DEFAULT_MARKET_TYPE = "forex";
const DEFAULT_EXIT_VOLUME = 1;

const normalizeName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isValidNumber = (value) => Number.isFinite(Number(value));

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : NaN;
};

const parseTagsInput = (input) => {
  if (input === undefined || input === null || input === "") return [];

  if (Array.isArray(input)) {
    return input
      .map((tag) => normalizeName(tag))
      .filter(Boolean)
      .filter((tag, index, arr) => arr.indexOf(tag) === index);
  }

  if (typeof input === "string") {
    const raw = input.trim();
    if (!raw) return [];

    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .map((tag) => normalizeName(tag))
            .filter(Boolean)
            .filter((tag, index, arr) => arr.indexOf(tag) === index);
        }
      } catch {
        // continue with delimiter parsing
      }
    }

    return raw
      .split(/[|,]/)
      .map((tag) => normalizeName(tag))
      .filter(Boolean)
      .filter((tag, index, arr) => arr.indexOf(tag) === index);
  }

  return [];
};

const parseRowsFromCsvBuffer = (buffer) => {
  const csvContent = buffer.toString("utf-8");

  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
  });
};

const parseImportRows = (req) => {
  if (req.file?.buffer) {
    return parseRowsFromCsvBuffer(req.file.buffer);
  }

  if (Array.isArray(req.body)) {
    return req.body;
  }

  if (Array.isArray(req.body?.trades)) {
    return req.body.trades;
  }

  if (typeof req.body?.trades === "string") {
    const parsed = JSON.parse(req.body.trades);
    return Array.isArray(parsed) ? parsed : [];
  }

  return [];
};

const getCaseInsensitiveValue = (row, key) => {
  if (!row || typeof row !== "object") return undefined;

  if (Object.prototype.hasOwnProperty.call(row, key)) {
    return row[key];
  }

  const targetKey = String(key).toLowerCase();
  const foundKey = Object.keys(row).find(
    (currentKey) => String(currentKey).toLowerCase() === targetKey,
  );

  return foundKey ? row[foundKey] : undefined;
};

const getFirstValue = (row, keys = []) => {
  for (const key of keys) {
    const value = getCaseInsensitiveValue(row, key);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
};

const parseNumberField = ({ row, keys, required = false, fieldName }) => {
  const raw = getFirstValue(row, keys);

  if (raw === undefined || raw === null || raw === "") {
    if (required) {
      return { error: `${fieldName} is required` };
    }
    return { value: undefined };
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return { error: `${fieldName} must be a valid number` };
  }

  return { value: parsed };
};

const normalizeTradeDirection = (value) => {
  const direction = normalizeName(value);
  if (!direction) return "";

  if (["buy", "bull", "long"].includes(direction)) return "long";
  if (["sell", "bear", "short"].includes(direction)) return "short";
  return direction;
};

const normalizeTradeResult = (value) => {
  const result = normalizeName(value);
  if (!result) return "";

  if (["won", "profit", "tp", "takeprofit"].includes(result)) return "win";
  if (["lose", "lost", "sl", "stoploss"].includes(result)) return "loss";
  if (["breakeven", "break-even", "be"].includes(result)) return "breakeven";

  return result;
};

const normalizeTradeStatus = (value, tradeResult) => {
  const normalizedStatus = normalizeName(value);
  if (normalizedStatus) return normalizedStatus;

  if (["win", "loss", "breakeven"].includes(tradeResult)) {
    return "exited";
  }

  return "exited";
};

const parseDateField = (row) => {
  const rawDate = getFirstValue(row, ["dateTime", "date", "time", "timestamp"]);

  if (rawDate === undefined || rawDate === null || rawDate === "") {
    return { error: "dateTime is required" };
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: "dateTime is invalid" };
  }

  return { value: parsedDate };
};

const normalizeExitEntries = (rawExit) => {
  if (rawExit === undefined || rawExit === null || rawExit === "") return [];

  if (Array.isArray(rawExit)) {
    return rawExit
      .map((item) => {
        if (item === null || item === undefined) return null;

        if (typeof item === "number" || typeof item === "string") {
          const price = Number(item);
          if (!Number.isFinite(price)) return null;
          return { price, volume: DEFAULT_EXIT_VOLUME };
        }

        const price = Number(item.price);
        const volume =
          item.volume === undefined ? DEFAULT_EXIT_VOLUME : Number(item.volume);

        if (!Number.isFinite(price) || !Number.isFinite(volume)) return null;
        return { price, volume };
      })
      .filter(Boolean);
  }

  if (typeof rawExit === "number") {
    return Number.isFinite(rawExit)
      ? [{ price: rawExit, volume: DEFAULT_EXIT_VOLUME }]
      : [];
  }

  if (typeof rawExit === "string") {
    const trimmed = rawExit.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        return normalizeExitEntries(parsed);
      } catch {
        return [];
      }
    }

    const numericValue = Number(trimmed);
    if (Number.isFinite(numericValue)) {
      return [{ price: numericValue, volume: DEFAULT_EXIT_VOLUME }];
    }
  }

  return [];
};

const deriveExitedPrice = ({
  row,
  tradeResult,
  takeProfitPrice,
  stoplossPrice,
}) => {
  const rawExit = getFirstValue(row, ["exitedPrice", "exit", "close"]);
  const explicitExit = normalizeExitEntries(rawExit);

  if (explicitExit.length > 0) {
    return explicitExit;
  }

  if (tradeResult === "win" && Number.isFinite(takeProfitPrice)) {
    return [{ price: takeProfitPrice, volume: DEFAULT_EXIT_VOLUME }];
  }

  if (tradeResult === "loss" && Number.isFinite(stoplossPrice)) {
    return [{ price: stoplossPrice, volume: DEFAULT_EXIT_VOLUME }];
  }

  return [];
};

const calculateRRIfNotProvided = ({
  rr,
  entryPrice,
  stoplossPrice,
  takeProfitPrice,
  tradeDirection,
}) => {
  // If RR is already provided and valid, return it
  if (Number.isFinite(rr)) {
    return rr;
  }

  // If TP or SL is not provided, can't calculate RR
  if (!Number.isFinite(takeProfitPrice) || !Number.isFinite(stoplossPrice)) {
    return 0;
  }

  // Calculate RR based on trade direction
  if (tradeDirection === "long") {
    const reward = takeProfitPrice - entryPrice;
    const risk = entryPrice - stoplossPrice;
    return risk !== 0 ? reward / risk : 0;
  } else if (tradeDirection === "short") {
    const reward = entryPrice - takeProfitPrice;
    const risk = stoplossPrice - entryPrice;
    return risk !== 0 ? reward / risk : 0;
  }

  return 0;
};

const normalizeTrade = (row, defaultMarketType = DEFAULT_MARKET_TYPE) => {
  const symbol = String(getFirstValue(row, ["symbol"]) || "")
    .trim()
    .toUpperCase();
  if (!symbol) return { error: "symbol is required" };

  const normalizedDirection = normalizeTradeDirection(
    getFirstValue(row, ["tradeDirection", "direction", "type", "side"]),
  );
  if (!normalizedDirection) return { error: "tradeDirection is required" };
  if (!["long", "short"].includes(normalizedDirection)) {
    return { error: "tradeDirection must be long or short" };
  }

  const entryPriceResult = parseNumberField({
    row,
    keys: ["entryPrice", "entry", "open"],
    required: true,
    fieldName: "entryPrice",
  });
  if (entryPriceResult.error) return { error: entryPriceResult.error };

  const stoplossPriceResult = parseNumberField({
    row,
    keys: ["stoplossPrice", "stopLossPrice", "stopLoss", "sl"],
    required: true,
    fieldName: "stoplossPrice",
  });
  if (stoplossPriceResult.error) return { error: stoplossPriceResult.error };

  const takeProfitPriceResult = parseNumberField({
    row,
    keys: ["takeProfitPrice", "takeprofitPrice", "takeProfit", "tp", "target"],
    required: false,
    fieldName: "takeProfitPrice",
  });
  if (takeProfitPriceResult.error)
    return { error: takeProfitPriceResult.error };

  const dateResult = parseDateField(row);
  if (dateResult.error) return { error: dateResult.error };

  const pnlResult = parseNumberField({
    row,
    keys: ["pnl", "profit", "pl"],
    required: false,
    fieldName: "pnl",
  });
  if (pnlResult.error) return { error: pnlResult.error };

  const riskPercentResult = parseNumberField({
    row,
    keys: ["riskPercent"],
    required: false,
    fieldName: "riskPercent",
  });
  if (riskPercentResult.error) return { error: riskPercentResult.error };

  const riskAmountResult = parseNumberField({
    row,
    keys: ["riskAmount"],
    required: false,
    fieldName: "riskAmount",
  });
  if (riskAmountResult.error) return { error: riskAmountResult.error };

  const rrResult = parseNumberField({
    row,
    keys: ["rr"],
    required: false,
    fieldName: "rr",
  });
  if (rrResult.error) return { error: rrResult.error };

  const tradeResult = normalizeTradeResult(
    getFirstValue(row, ["tradeResult", "result", "outcome"]),
  );
  const tradeStatus = normalizeTradeStatus(
    getFirstValue(row, ["tradeStatus", "status"]),
    tradeResult,
  );

  const marketType = normalizeName(
    getFirstValue(row, ["marketType", "market", "assetClass"]) ||
      defaultMarketType,
  );
  if (!marketType) return { error: "marketType is required" };

  const tagNames = parseTagsInput(getFirstValue(row, ["tags", "tag"]));
  const strategyName = normalizeName(
    getFirstValue(row, ["strategy", "setup", "statergy"]),
  );

  const exitedPrice = deriveExitedPrice({
    row,
    tradeResult,
    takeProfitPrice: takeProfitPriceResult.value,
    stoplossPrice: stoplossPriceResult.value,
  });

  // Calculate RR if not provided
  const calculatedRR = calculateRRIfNotProvided({
    rr: rrResult.value,
    entryPrice: entryPriceResult.value,
    stoplossPrice: stoplossPriceResult.value,
    takeProfitPrice: takeProfitPriceResult.value,
    tradeDirection: normalizedDirection,
  });

  return {
    normalized: {
      symbol,
      tradeDirection: normalizedDirection,
      entryPrice: entryPriceResult.value,
      stoplossPrice: stoplossPriceResult.value,
      takeProfitPrice: takeProfitPriceResult.value,
      exitedPrice,
      riskPercent: riskPercentResult.value,
      riskAmount: riskAmountResult.value,
      pnl: pnlResult.value,
      tradeResult,
      tradeStatus,
      dateTime: dateResult.value,
      tagNames,
      strategyName,
      tradeNotes: String(
        getFirstValue(row, ["tradeNotes", "notes", "note"]) || "",
      ).trim(),
      marketType,
      rr: calculatedRR,
      balanceAfterTrade: parseOptionalNumber(
        getFirstValue(row, ["balanceAfterTrade"]),
      ),
      tradeNumber: parseOptionalNumber(getFirstValue(row, ["tradeNumber"])),
    },
  };
};

const normalizeTradeRow = (row, defaultMarketType = DEFAULT_MARKET_TYPE) =>
  normalizeTrade(row, defaultMarketType);

const buildNormalizedNameMap = (docs) => {
  const map = new Map();

  for (const doc of docs) {
    const normalizedKey = normalizeName(doc?.name);
    if (normalizedKey && !map.has(normalizedKey)) {
      map.set(normalizedKey, doc);
    }
  }

  return map;
};

const uniqueObjectIds = (ids) => {
  const seen = new Set();
  const unique = [];

  for (const id of ids) {
    if (!id) continue;
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(id);
  }

  return unique;
};

module.exports = {
  DEFAULT_MARKET_TYPE,
  normalizeName,
  parseImportRows,
  normalizeTrade,
  normalizeTradeRow,
  buildNormalizedNameMap,
  uniqueObjectIds,
};
