import fs from "fs";

const STOCKS_FILE = "./config/stocks.json";
const OUTPUT_FILE = "./data/yahoo_posts.json";

const stocks = JSON.parse(
  fs.readFileSync(STOCKS_FILE, "utf8")
);

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

function normalizeStock(stock) {
  if (typeof stock === "string") {
    return {
      keyword: stock
    };
  }

  return {
    keyword: stock.keyword
  };
}

function getTodayJST() {
  const now = new Date();

  const jst = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Tokyo"
    })
  );

  const yyyy = jst.getFullYear();
  const mm = String(jst.getMonth() + 1).padStart(2, "0");
  const dd = String(jst.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

async function fetchYahooPosts(keyword) {
  const url =
    `https://search.yahoo.co.jp/realtime/api/v1/pagination` +
    `?p=${encodeURIComponent(keyword)}` +
    `&md=h` +
    `&results=40`;

  console.log(`Fetching Yahoo realtime: ${keyword}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(
      `${keyword}: HTTP ${response.status}`
    );
  }

  const json = await response.json();

  const total =
    json?.timeline?.head?.totalResultsAvailable;

  if (typeof total !== "number") {
    throw new Error(
      `${keyword}: totalResultsAvailable not found`
    );
  }

  return total;
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

const today = getTodayJST();

const newData = [];

for (const rawStock of stocks) {
  const stock = normalizeStock(rawStock);

  if (!stock.keyword) {
    console.log(
      `Skip invalid stock: ${JSON.stringify(stock)}`
    );
    continue;
  }

  try {
    const posts24h =
      await fetchYahooPosts(stock.keyword);

    newData.push({
      keyword: stock.keyword,
      date: today,
      posts24h,
      fetchedAt: new Date().toISOString()
    });

    console.log(
      `${stock.keyword}: ${posts24h} posts`
    );
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
  `Saved ${finalData.length} records to ${OUTPUT_FILE}`
);
