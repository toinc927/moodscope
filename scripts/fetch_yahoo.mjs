// MoodScope Yahoo!リアルタイム検索
// 複数銘柄の24時間投稿数を取得して data/yahoo_posts.json に保存

import fs from "fs";

const keywords = [
  "ファナック",
  "安川電機",
  "ハーモニック・ドライブ",
  "IHI",
  "ソフトバンクグループ",
  "ローム",
  "北海道電力",
  "九州電力",
  "QPS研究所",
  "アストロスケール"
];

const results = [];

for (const keyword of keywords) {
  console.log(`取得中: ${keyword}`);

  const url =
    "https://search.yahoo.co.jp/realtime/api/v1/pagination" +
    "?p=" + encodeURIComponent(keyword) +
    "&md=h&results=40";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MoodScope/0.1)"
      }
    });

    if (!res.ok) {
      throw new Error(`Yahoo API HTTP ${res.status}`);
    }

    const data = await res.json();

    const total =
      data?.timeline?.head?.totalResultsAvailable ?? null;

    results.push({
      date: new Date().toISOString().slice(0, 10),
      fetchedAt: new Date().toISOString(),
      keyword,
      posts24h: total
    });

    console.log(`${keyword}: ${total}件`);

  } catch (error) {
    console.error(`${keyword}: 取得失敗`);
    console.error(error.message);

    results.push({
      date: new Date().toISOString().slice(0, 10),
      fetchedAt: new Date().toISOString(),
      keyword,
      posts24h: null,
      error: error.message
    });
  }
}

const filePath = "data/yahoo_posts.json";

let history = [];

if (fs.existsSync(filePath)) {
  try {
    history = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    history = [];
  }
}

history.push(...results);

fs.mkdirSync("data", { recursive: true });

fs.writeFileSync(
  filePath,
  JSON.stringify(history, null, 2),
  "utf8"
);

console.log("");
console.log(`保存完了: ${filePath}`);
console.log(`今回取得: ${results.length}銘柄`);
