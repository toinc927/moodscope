// MoodScope: Yahoo!リアルタイム検索から複数銘柄の24時間投稿数を取得
const keywords = [
  "ファナック",
  "安川電機",
  "ハーモニック・ドライブ",
  "IHI",
  "イビデン",
  "住友電工",
  "古河電工",
  "JX金属",
  "ティアフォー",
  "QPS"
];

const fs = await import("node:fs/promises");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPosts24h(keyword) {
  const url =
    "https://search.yahoo.co.jp/realtime/api/v1/pagination" +
    "?p=" + encodeURIComponent(keyword) +
    "&md=h&results=40";

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MoodScope/0.2)"
    }
  });

  if (!res.ok) {
    throw new Error(`${keyword}: Yahoo HTTP ${res.status}`);
  }

  const data = await res.json();
  const total = data?.timeline?.head?.totalResultsAvailable;

  if (typeof total !== "number") {
    throw new Error(`${keyword}: 投稿数を取得できませんでした`);
  }

  return total;
}

const now = new Date();
const date = now.toISOString().slice(0, 10);
const fetchedAt = now.toISOString();

const results = [];

for (const keyword of keywords) {
  try {
    const posts24h = await fetchPosts24h(keyword);
    results.push({ date, fetchedAt, keyword, posts24h });
    console.log(`${keyword}: ${posts24h}`);
  } catch (e) {
    console.error(String(e));
  }
  await sleep(800);
}

if (results.length === 0) {
  throw new Error("全銘柄の取得に失敗しました");
}

const file = "data/yahoo_posts.json";

let history = [];
try {
  history = JSON.parse(await fs.readFile(file, "utf8"));
  if (!Array.isArray(history)) history = [];
} catch {
  history = [];
}

// 同一銘柄・同一日の重複は最新値で置き換える
for (const row of results) {
  const idx = history.findIndex(
    x => x.keyword === row.keyword && x.date === row.date
  );
  if (idx >= 0) history[idx] = row;
  else history.push(row);
}

history.sort((a, b) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.keyword.localeCompare(b.keyword);
});

await fs.mkdir("data", { recursive: true });
await fs.writeFile(file, JSON.stringify(history, null, 2) + "\n");

console.log(`保存完了: ${file} / ${results.length}銘柄`);
