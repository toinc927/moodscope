import fs from "fs";

const inputFile = "data/yahoo_posts.json";
const outputFile = "data/mood_data.json";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

if (!fs.existsSync(inputFile)) {
  console.log(`${inputFile} がまだありません。`);
  process.exit(0);
}

const records = JSON.parse(fs.readFileSync(inputFile, "utf8"));

const keywords = [
  "ファナック",
  "安川電機",
  "ハーモニック・ドライブ",
  "IHI"
];

const results = [];

for (const keyword of keywords) {
  const rows = records
    .filter(row => row.keyword === keyword)
    .sort((a, b) => a.date.localeCompare(b.date));

  const latest = rows[rows.length - 1];

  if (!latest) {
    results.push({
      keyword,
      status: "データなし",
      heat: null
    });
    continue;
  }

  // 現在の日を含めず、過去30日分を基準値にする
  const previous = rows
    .slice(0, -1)
    .slice(-30)
    .map(row => Number(row.posts24h))
    .filter(value => Number.isFinite(value) && value >= 0);

  // 過去7日分未満ならまだHeatを計算しない
  if (previous.length < 7) {
    results.push({
      keyword,
      date: latest.date,
      posts24h: latest.posts24h,
      baselinePosts24h: null,
      heat: null,
      status: "蓄積中"
    });
    continue;
  }

  const baseline = median(previous);

  const posts = Number(latest.posts24h);

  let heat = 50;

  if (baseline > 0 && posts > 0) {
    heat = 50 + 25 * Math.log2(posts / baseline);
  }

  heat = clamp(Math.round(heat), 0, 100);

  results.push({
    keyword,
    date: latest.date,
    posts24h: posts,
    baselinePosts24h: Math.round(baseline),
    heat,
    status: "計算済み"
  });
}

const output = {
  updatedAt: new Date().toISOString(),
  stocks: results
};

fs.mkdirSync("data", { recursive: true });

fs.writeFileSync(
  outputFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log(`Heat計算完了: ${outputFile}`);
