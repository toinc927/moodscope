// MoodScope Yahoo!リアルタイム検索 test
const keyword = "ファナック";
const url =
  "https://search.yahoo.co.jp/realtime/api/v1/pagination" +
  "?p=" + encodeURIComponent(keyword) +
  "&md=h&results=40";

const res = await fetch(url, {
  headers: { "User-Agent": "Mozilla/5.0 (compatible; MoodScope/0.1)" }
});

if (!res.ok) throw new Error(`Yahoo API HTTP ${res.status}`);

const data = await res.json();
const total = data?.timeline?.head?.totalResultsAvailable ?? null;

console.log(JSON.stringify({
  fetchedAt: new Date().toISOString(),
  keyword,
  totalResultsAvailable: total
}, null, 2));
