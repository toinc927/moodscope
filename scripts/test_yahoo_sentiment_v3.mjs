const pageUrl =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent("ファナック");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const TARGET =
  "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/2738.js";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "*/*",
      "Referer": pageUrl
    }
  });

  return {
    status: res.status,
    text: await res.text()
  };
}

function printAround(text, pos, before = 2500, after = 5000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function showHits(text, regex, label, limit = 30) {
  let count = 0;
  let match;

  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null && count < limit) {
    console.log("");
    console.log("==================================================");
    console.log(`HIT: ${label}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`MATCH: ${match[0]}`);
    console.log("==================================================");

    printAround(text, match.index);

    count++;
  }

  console.log("");
  console.log(`${label} COUNT: ${count}`);
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo SENTIMENT API CALL SITE diagnostic");
  console.log("==================================================");

  console.log(`TARGET: ${TARGET}`);

  const result = await fetchText(TARGET);

  console.log(`HTTP: ${result.status}`);
  console.log(`JS LENGTH: ${result.text.length}`);

  const js = result.text;

  console.log("");
  console.log("==================================================");
  console.log("MODULE 77507 IMPORT");
  console.log("==================================================");

  showHits(
    js,
    /ta\s*=\s*s\(77507\)/g,
    "ta=s(77507)",
    20
  );

  console.log("");
  console.log("==================================================");
  console.log("ta.Z CALLS");
  console.log("==================================================");

  showHits(
    js,
    /ta\.Z/g,
    "ta.Z",
    30
  );

  console.log("");
  console.log("==================================================");
  console.log("77507 DIRECT CALL PATTERNS");
  console.log("==================================================");

  showHits(
    js,
    /\(0,\s*ta\.Z\)/g,
    "(0,ta.Z)",
    30
  );

  console.log("");
  console.log("==================================================");
  console.log("LOADCHARTDATA DEFINITION");
  console.log("==================================================");

  showHits(
    js,
    /this\.loadChartData\s*=\s*async/g,
    "loadChartData definition",
    10
  );

  console.log("");
  console.log("==================================================");
  console.log("SENTIMENT TERMS");
  console.log("==================================================");

  showHits(
    js,
    /sentimentData|sentimentSince|sentimentUntil|dataPositive|dataNegative/gi,
    "sentiment",
    30
  );

  console.log("");
  console.log("==================================================");
  console.log("API PATH STRINGS");
  console.log("==================================================");

  showHits(
    js,
    /["'`](\/[^"'`]*sentiment[^"'`]*)["'`]/gi,
    "sentiment API path",
    30
  );

  console.log("");
  console.log("==================================================");
  console.log("DIAGNOSTIC FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
