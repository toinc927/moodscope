const keywords = [
  "ファナック",
  "安川電機",
  "ハーモニック・ドライブ",
  "IHI"
];

async function fetchYahoo(keyword) {
  const url =
    `https://search.yahoo.co.jp/realtime/api/v1/pagination?p=${encodeURIComponent(keyword)}&md=h&results=40`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    }
  });

  if (!res.ok) {
    throw new Error(`${keyword}: HTTP ${res.status}`);
  }

  const data = await res.json();

  console.log(`\n===== ${keyword} =====`);

  // Yahooから返ってきたデータの中から、
  // 「感情」に関係しそうな部分を探すため、
  // レスポンス全体の構造を確認する
  console.log(JSON.stringify(data, null, 2).slice(0, 15000));
}

for (const keyword of keywords) {
  try {
    await fetchYahoo(keyword);
  } catch (error) {
    console.error(error.message);
  }
}
