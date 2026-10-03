import fs from "fs";

const STOCKS_FILE = "./config/stocks.json";
const INPUT_FILE = "./data/yahoo_posts.json";
const OUTPUT_FILE = "./data/mood_data.json";

const stocks = JSON.parse(
  fs.readFileSync(STOCKS_FILE, "utf8")
);

const postsData = JSON.parse(
  fs.readFileSync(INPUT_FILE, "utf8")
);

function getKeyword(stock) {
  if (typeof stock === "string") {
    return stock;
  }

  return stock.keyword;
}

function median(values) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(
    sorted.length / 2
  );

  if (sorted.length % 2 === 0) {
    return (
      (sorted[middle - 1] + sorted[middle]) / 2
    );
  }

  return sorted[middle];
}

function calculateHeat(posts, baseline) {
  if (
    posts == null ||
    baseline == null ||
    baseline <= 0
  ) {
    return null;
  }

  const heat =
    50 +
    25 *
      Math.log2(posts / baseline);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(heat)
    )
  );
}

const output = [];

for (const rawStock of stocks) {
  const keyword = getKeyword(rawStock);

  const rows = postsData
    .filter(row => row.keyword === keyword)
    .sort((a, b) =>
      a.date.localeCompare(b.date)
    );

  if (rows.length === 0) {
    output.push({
      keyword,
      date: null,
      posts24h: null,
      baselinePosts24h: null,
      heat: null,
      status: "データなし"
    });

    continue;
  }

  const latest = rows[rows.length - 1];

  const previousRows = rows
    .slice(0, -1)
    .slice(-30);

  const previousPosts = previousRows
    .map(row => row.posts24h)
    .filter(
      value =>
        typeof value === "number" &&
        value > 0
    );

  if (previousPosts.length < 7) {
    output.push({
      keyword,
      date: latest.date,
      posts24h: latest.posts24h,
      baselinePosts24h: null,
      heat: null,
      status: "蓄積中"
    });

    continue;
  }

  const baseline =
    median(previousPosts);

  const heat =
    calculateHeat(
      latest.posts24h,
      baseline
    );

  output.push({
    keyword,
    date: latest.date,
    posts24h: latest.posts24h,
    baselinePosts24h: Math.round(
      baseline
    ),
    heat,
    status: "計算済み"
  });
}

const result = {
  updatedAt: new Date().toISOString(),
  stocks: output
};

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    result,
    null,
    2
  ),
  "utf8"
);

console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);
