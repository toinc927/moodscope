const keyword = "ファナック";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const pageUrl =
  `https://search.yahoo.co.jp/realtime/search?p=${encodeURIComponent(keyword)}`;

const targetChunk =
  "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/612.js";

async function fetchText(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "*/*",
      ...headers
    }
  });

  return {
    status: res.status,
    text: await res.text()
  };
}

function showContext(text, position, before = 5000, after = 7000) {
  console.log("\n");
  console.log("########################################");
  console.log(`POSITION: ${position}`);
  console.log("########################################");

  console.log(
    text.slice(
      Math.max(0, position - before),
      Math.min(text.length, position + after)
    )
  );
}

function findAll(text, term, limit = 50) {
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();

  let pos = 0;
  let count = 0;

  while (count < limit) {
    const i = lower.indexOf(needle, pos);

    if (i < 0) break;

    console.log("\n");
    console.log("========================================");
    console.log(`FOUND: ${term}`);
    console.log(`POSITION: ${i}`);
    console.log("========================================");

    showContext(text, i, 2500, 5000);

    pos = i + needle.length;
    count++;
  }

  return count;
}

function regexAll(text, regex, label, limit = 100) {
  let match;
  let count = 0;

  regex.lastIndex = 0;

  while (
    (match = regex.exec(text)) !== null &&
    count < limit
  ) {
    console.log("\n");
    console.log("========================================");
    console.log(`REGEX: ${label}`);
    console.log(`MATCH: ${match[0]}`);
    console.log(`POSITION: ${match.index}`);
    console.log("========================================");

    showContext(text, match.index, 3000, 5000);

    count++;
  }

  return count;
}

async function main() {
  console.log("========================================");
  console.log("Yahoo loadChartData / N.Z diagnostic");
  console.log("========================================");

  console.log(`KEYWORD: ${keyword}`);
  console.log(`CHUNK: ${targetChunk}`);

  const result = await fetchText(targetChunk, {
    "Accept":
      "application/javascript,text/javascript,*/*;q=0.1",
    "Referer": pageUrl
  });

  console.log(`\nHTTP STATUS: ${result.status}`);
  console.log(`JS LENGTH: ${result.text.length}`);

  const js = result.text;

  console.log("\n");
  console.log("########################################");
  console.log("1. loadChartData");
  console.log("########################################");

  findAll(
    js,
    "loadChartData",
    20
  );

  console.log("\n");
  console.log("########################################");
  console.log("2. N.Z");
  console.log("########################################");

  findAll(
    js,
    "N.Z",
    50
  );

  console.log("\n");
  console.log("########################################");
  console.log("3. N = s(...)");
  console.log("########################################");

  regexAll(
    js,
    /N\s*=\s*s\(\s*\d+\s*\)/g,
    "N = s(NUMBER)",
    50
  );

  console.log("\n");
  console.log("########################################");
  console.log("4. s(NUMBER) around loadChartData");
  console.log("########################################");

  const loadPos =
    js.indexOf("loadChartData");

  if (loadPos >= 0) {
    const start =
      Math.max(0, loadPos - 15000);

    const section =
      js.slice(
        start,
        Math.min(js.length, loadPos + 15000)
      );

    regexAll(
      section,
      /s\(\s*\d+\s*\)/g,
      "s(NUMBER) near loadChartData",
      100
    );
  } else {
    console.log("loadChartData not found");
  }

  console.log("\n");
  console.log("########################################");
  console.log("5. tweetTransit");
  console.log("########################################");

  findAll(
    js,
    "tweetTransit",
    30
  );

  console.log("\n");
  console.log("########################################");
  console.log("6. sentimentData");
  console.log("########################################");

  findAll(
    js,
    "sentimentData",
    30
  );

  console.log("\n");
  console.log("########################################");
  console.log("7. dataPositive");
  console.log("########################################");

  findAll(
    js,
    "dataPositive",
    30
  );

  console.log("\n");
  console.log("########################################");
  console.log("8. dataNegative");
  console.log("########################################");

  findAll(
    js,
    "dataNegative",
    30
  );

  console.log("\n");
  console.log("########################################");
  console.log("9. fetch / endpoint terms");
  console.log("########################################");

  regexAll(
    js,
    /fetch\s*\(/g,
    "fetch(",
    50
  );

  regexAll(
    js,
    /XMLHttpRequest/g,
    "XMLHttpRequest",
    50
  );

  regexAll(
    js,
    /\/realtime\/api\/[^"'`\\]*/g,
    "/realtime/api/...",
    50
  );

  regexAll(
    js,
    /\/api\/v\d+\/[^"'`\\]*/g,
    "/api/vN/...",
    50
  );

  console.log("\n");
  console.log("========================================");
  console.log("DIAGNOSTIC FINISHED");
  console.log("========================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
