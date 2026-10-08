import fs from "fs";

const STOCKS_FILE = "./config/stocks.json";
const OUTPUT_FILE = "./data/yahoo_posts.json";

const METHOD_VERSION = "v1.0";

const RESULTS_PER_PAGE = 40;
const MAX_PAGES = 20;
const REQUEST_DELAY_MS = 1000;

const stocks = JSON.parse(
  fs.readFileSync(STOCKS_FILE, "utf8")
);

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

function normalizeStock(stock) {
  if (typeof stock === "string") {
    return {
      keyword: stock,
      aliases: []
    };
  }

  return {
    keyword: stock.keyword,
    aliases: Array.isArray(stock.aliases)
      ? stock.aliases
      : []
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

function getSearchTerms(stock) {
  const terms = [
    stock.keyword,
    ...stock.aliases
  ];

  return Array.from(
    new Set(
      terms
        .filter(Boolean)
        .map(term => String(term).trim())
        .filter(Boolean)
    )
  );
}

async function fetchYahooPage(
  query,
  oldestTweetId = null
) {
  const params = new URLSearchParams();

  params.set("p", query);
  params.set("md", "h");
  params.set(
    "results",
    String(RESULTS_PER_PAGE)
  );

  if (oldestTweetId) {
    params.set(
      "oldestTweetId",
      oldestTweetId
    );
  }

  const url =
    "https://search.yahoo.co.jp/realtime/api/v1/pagination?" +
    params.toString();

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept":
        "application/json, text/plain, */*",
      "Referer":
        "https://search.yahoo.co.jp/realtime/search"
    }
  });

  if (!response.ok) {
    throw new Error(
      `${query}: HTTP ${response.status}`
    );
  }

  const json = await response.json();

  const timeline =
    json?.timeline;

  if (!timeline) {
    throw new Error(
      `${query}: timeline not found`
    );
  }

  const head =
    timeline.head || {};

  const entries =
    Array.isArray(timeline.entry)
      ? timeline.entry
      : [];

  return {
    totalResultsAvailable:
      typeof head.totalResultsAvailable === "number"
        ? head.totalResultsAvailable
        : null,

    totalResultsReturned:
      typeof head.totalResultsReturned === "number"
        ? head.totalResultsReturned
        : entries.length,

    entries
  };
}

async function fetchAllForTerm(query) {
  console.log("");
  console.log(
    `----- Search term: ${query} -----`
  );

  const uniquePosts = new Map();

  let cursor = null;
  let pagesFetched = 0;
  let capped = false;

  let totalResultsAvailable = null;

  for (
    let page = 1;
    page <= MAX_PAGES;
    page++
  ) {
    console.log(
      `${query}: page ${page}`
    );

    const result =
      await fetchYahooPage(
        query,
        cursor
      );

    pagesFetched++;

    if (
      totalResultsAvailable === null &&
      result.totalResultsAvailable !== null
    ) {
      totalResultsAvailable =
        result.totalResultsAvailable;
    }

    const entries =
      result.entries;

    console.log(
      `${query}: returned ${entries.length}`
    );

    if (entries.length === 0) {
      console.log(
        `${query}: no more entries`
      );
      break;
    }

    let newCount = 0;

    for (const entry of entries) {
      const id =
        entry?.id ||
        entry?.url ||
        entry?.detailUrl;

      if (!id) {
        continue;
      }

      if (!uniquePosts.has(id)) {
        uniquePosts.set(
          id,
          entry
        );

        newCount++;
      }
    }

    console.log(
      `${query}: new unique posts ${newCount}`
    );

    const lastEntry =
      entries[entries.length - 1];

    const nextCursor =
      lastEntry?.id || null;

    if (!nextCursor) {
      console.log(
        `${query}: next cursor not found`
      );
      break;
    }

    if (nextCursor === cursor) {
      console.log(
        `${query}: cursor did not advance`
      );
      break;
    }

    cursor = nextCursor;

    if (
      result.totalResultsAvailable !== null &&
      uniquePosts.size >=
        result.totalResultsAvailable
    ) {
      console.log(
        `${query}: all available results collected`
      );
      break;
    }

    if (
      entries.length < RESULTS_PER_PAGE
    ) {
      console.log(
        `${query}: last page detected`
      );
      break;
    }

    if (page === MAX_PAGES) {
      capped = true;

      console.log(
        `${query}: MAX_PAGES reached`
      );

      break;
    }

    await sleep(
      REQUEST_DELAY_MS
    );
  }

  return {
    posts: uniquePosts,
    pagesFetched,
    capped,
    totalResultsAvailable
  };
}

let oldData = [];

if (fs.existsSync(OUTPUT_FILE)) {
  try {
    oldData = JSON.parse(
      fs.readFileSync(
        OUTPUT_FILE,
        "utf8"
      )
    );
  } catch {
    oldData = [];
  }
}

const today = getTodayJST();

const newData = [];

for (const rawStock of stocks) {
  const stock =
    normalizeStock(rawStock);

  if (!stock.keyword) {
    console.log(
      `Skip invalid stock: ${JSON.stringify(stock)}`
    );
    continue;
  }

  const searchTerms =
    getSearchTerms(stock);

  console.log("");
  console.log(
    "===================================="
  );
  console.log(
    `STOCK: ${stock.keyword}`
  );
  console.log(
    `SEARCH TERMS: ${searchTerms.join(", ")}`
  );
  console.log(
    "===================================="
  );

  const uniquePosts = new Map();

  let totalPagesFetched = 0;

  let capped = false;

  let hadError = false;

  const termResults = [];

  for (const term of searchTerms) {
    try {
      const result =
        await fetchAllForTerm(term);

      totalPagesFetched +=
        result.pagesFetched;

      if (result.capped) {
        capped = true;
      }

      for (
        const [id, entry]
        of result.posts
      ) {
        if (!uniquePosts.has(id)) {
          uniquePosts.set(
            id,
            entry
          );
        }
      }

      termResults.push({
        term,
        pagesFetched:
          result.pagesFetched,
        totalResultsAvailable:
          result.totalResultsAvailable,
        uniquePostsFetched:
          result.posts.size,
        capped: result.capped,
        status: "success"
      });

    } catch (error) {
      hadError = true;

      console.error(
        `ERROR ${term}:`,
        error.message
      );

      termResults.push({
        term,
        pagesFetched: 0,
        totalResultsAvailable: null,
        uniquePostsFetched: 0,
        capped: false,
        status: "error",
        error: error.message
      });
    }

    await sleep(
      REQUEST_DELAY_MS
    );
  }

  const status =
    hadError
      ? "error"
      : "success";

  const posts24h =
    hadError
      ? null
      : uniquePosts.size;

  const row = {
    keyword: stock.keyword,
    date: today,

    posts24h,

    searchTerms,

    pagesFetched:
      totalPagesFetched,

    capped,

    status,

    methodVersion:
      METHOD_VERSION,

    termResults,

    fetchedAt:
      new Date().toISOString()
  };

  newData.push(row);

  console.log("");
  console.log(
    `${stock.keyword}: ${posts24h} unique posts`
  );

  console.log(
    `${stock.keyword}: status=${status}`
  );

  console.log(
    `${stock.keyword}: pages=${totalPagesFetched}`
  );

  console.log(
    `${stock.keyword}: capped=${capped}`
  );
}

const merged = [
  ...oldData,
  ...newData
];

const unique = new Map();

for (const row of merged) {
  const key =
    `${row.keyword}|${row.date}`;

  unique.set(
    key,
    row
  );
}

const finalData =
  Array.from(unique.values())
    .sort((a, b) => {
      if (
        a.keyword !== b.keyword
      ) {
        return a.keyword.localeCompare(
          b.keyword
        );
      }

      return a.date.localeCompare(
        b.date
      );
    });

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    finalData,
    null,
    2
  ),
  "utf8"
);

console.log("");
console.log(
  "===================================="
);
console.log(
  "Yahoo realtime v1.0 saved"
);
console.log(
  "===================================="
);

console.log(
  `Stocks: ${newData.length}`
);

console.log(
  `Records: ${finalData.length}`
);

console.log(
  `Output: ${OUTPUT_FILE}`
);
