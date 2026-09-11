// MoodScope Yahoo!リアルタイム検索
// 投稿数を取得して data/yahoo_posts.json に保存

const keyword = "ファナック";

const url =
  "https://search.yahoo.co.jp/realtime/api/v1/pagination" +
  "?p=" + encodeURIComponent(keyword) +
  "&md=h&results=40";

const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; MoodScope/0.1)"
  }
});

if (!res.ok) {
  throw new Error(`Yahoo API HTTP ${res.status}`);
}

const data = await res.json();

const total = data?.timeline?.head?.totalResultsAvailable ?? null;

if (total === null) {
  throw new Error("Yahooから投稿数を取得できませんでした");
}

// 日本時間の日付
const now = new Date();

const jst = new Date(
  now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
);

const date =
  jst.getFullYear() +
  "-" +
  String(jst.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(jst.getDate()).padStart(2, "0");

// 保存用データ
const record = {
  date,
  fetchedAt: now.toISOString(),
  keyword,
  posts24h: total
};

console.log(JSON.stringify(record, null, 2));

// ファイル操作
import { mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("data", { recursive: true });

const file = "data/yahoo_posts.json";

let history = [];

try {
  const old = await readFile(file, "utf8");
  history = JSON.parse(old);
} catch {
  history = [];
}

// 同じ日のデータがあれば更新
const index = history.findIndex(
  item => item.date === date && item.keyword === keyword
);

if (index >= 0) {
  history[index] = record;
} else {
  history.push(record);
}

// 日付順に並べる
history.sort((a, b) => a.date.localeCompare(b.date));

await writeFile(
  file,
  JSON.stringify(history, null, 2) + "\n",
  "utf8"
);

console.log(`保存完了: ${file}`);
