import fs from "fs";

const STOCKS_FILE = "./config/stocks.json";
const OUTPUT_FILE = "./data/yahoo_prices.json";

const stocks = JSON.parse(fs.readFileSync(STOCKS_FILE, "utf8"));

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeStock(stock) {
  if (typeof stock === "string") {
    return {
      keyword: stock,
      symbol: null
    };
  }

  return {
    keyword: stock.keyword,
    symbol: stock.symbol
  };
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

async function fetchPrice(stock) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(stock.symbol)}` +
    `?range=5d&interval=1d`;

  console.log(`Fetching price: ${stock.keyword} ${stock.symbol}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(
      `${stock.symbol}: HTTP ${response.status}`
    );
  }

  const json = await response.json();
  const result = json?.chart?.result?.[0];

  if (!result) {
    throw new Error(`${stock.symbol}: chart data not found`);
  }

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0];

  if (!quote || timestamps.length === 0) {
    throw new Error(`${stock.symbol}: price data not found`);
  }

  const rows = [];

  for (let i = 0; i < timestamps.length; i++) {
    const close = quote.close?.[i];

    if (close == null) continue;

    rows.push({
      keyword: stock.keyword,
      symbol: stock.symbol,
      date: formatDate(timestamps[i]),
      open: quote.open?.[i] ?? null,
      high: quote.high?.[i] ?? null,
      low: quote.low?.[i] ?? null,
      close: close,
      volume: quote.volume?.[i] ?? null
    });
  }

  return rows;
}

let oldData = [];

if (fs.existsSync(OUTPUT_FILE)) {
  try {
    oldData = JSON.parse(
      fs.readFileSync(OUTPUT_FILE, "utf8")
    );
  } catch {
    oldData = [];
  }
}

const newData = [];

for (const rawStock of stocks) {
  const stock = normalizeStock(rawStock);

  if (!stock.keyword || !stock.symbol) {
    console.log(
      `Skip: ${JSON.stringify(stock)}`
    );
    continue;
  }

  try {
    const rows = await fetchPrice(stock);
    newData.push(...rows);
  } catch (error) {
    console.error(
      `ERROR ${stock.keyword}:`,
      error.message
    );
  }

  await sleep(1000);
}

const merged = [
  ...oldData,
  ...newData
];

const unique = new Map();

for (const row of merged) {
  const key = `${row.keyword}|${row.date}`;
  unique.set(key, row);
}

const finalData = Array.from(unique.values())
  .sort((a, b) => {
    if (a.keyword !== b.keyword) {
      return a.keyword.localeCompare(b.keyword);
    }

    return a.date.localeCompare(b.date);
  });

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(finalData, null, 2),
  "utf8"
);

console.log(
  `Saved ${finalData.length} price records to ${OUTPUT_FILE}`
);
