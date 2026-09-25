const TARGET =
  "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/2738.js";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "*/*",
      "Referer": "https://search.yahoo.co.jp/realtime/search"
    }
  });

  return {
    status: res.status,
    text: await res.text()
  };
}

function around(text, pos, before = 1500, after = 4000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function find(text, regex, label, limit = 20) {
  let count = 0;
  let m;

  regex.lastIndex = 0;

  while ((m = regex.exec(text)) !== null && count < limit) {
    console.log("");
    console.log("==================================================");
    console.log(label);
    console.log(`POSITION: ${m.index}`);
    console.log(`MATCH: ${m[0]}`);
    console.log("==================================================");

    around(text, m.index);

    count++;
  }

  console.log("");
  console.log(`${label} COUNT: ${count}`);
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo SENTIMENT CALL SITE FINAL DIAGNOSTIC");
  console.log("==================================================");

  const result = await fetchText(TARGET);

  console.log(`HTTP: ${result.status}`);
  console.log(`JS LENGTH: ${result.text.length}`);

  const js = result.text;

  // 1. ta=s(77507)
  find(
    js,
    /ta\s*=\s*s\(77507\)/g,
    "MODULE 77507 IMPORT",
    10
  );

  // 2. 実際の ta.Z(...) 呼び出しだけを探す
  find(
    js,
    /ta\.Z\s*\(/g,
    "ACTUAL ta.Z(...) CALL",
    30
  );

  // 3. (0,ta.Z)(...) 形式
  find(
    js,
    /\(0,\s*ta\.Z\)\s*\(/g,
    "ACTUAL (0,ta.Z)(...) CALL",
    30
  );

  // 4. sentimentSince / sentimentUntil
  find(
    js,
    /sentimentSince|sentimentUntil/g,
    "SENTIMENT PARAMETER",
    30
  );

  // 5. loadChartData の定義
  find(
    js,
    /this\.loadChartData\s*=\s*async/g,
    "LOADCHARTDATA DEFINITION",
    10
  );

  // 6. loadChartData の呼び出し
  find(
    js,
    /loadChartData\s*\(/g,
    "LOADCHARTDATA CALL",
    30
  );

  // 7. API pathらしい文字列
  find(
    js,
    /["'`](\/[^"'`]*(?:sentiment|chart|timeline)[^"'`]*)["'`]/gi,
    "POSSIBLE API PATH",
    50
  );

  console.log("");
  console.log("==================================================");
  console.log("FINAL DIAGNOSTIC FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
