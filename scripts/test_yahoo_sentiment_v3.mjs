const keyword = "ファナック";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const chunkUrl =
  "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/612.js";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "*/*",
      "Referer":
        "https://search.yahoo.co.jp/realtime/search?p=" +
        encodeURIComponent(keyword)
    }
  });

  return {
    status: res.status,
    text: await res.text()
  };
}

function showContext(text, position, before = 1500, after = 5000) {
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

function findAll(text, regex, label, before = 1200, after = 3500) {
  let match;
  let count = 0;

  while ((match = regex.exec(text)) !== null && count < 20) {
    console.log("\n");
    console.log("========================================");
    console.log(`MATCH: ${label}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`TEXT: ${match[0]}`);
    console.log("========================================");

    showContext(
      text,
      match.index,
      before,
      after
    );

    count++;
  }

  console.log(
    `\n${label} COUNT: ${count}`
  );

  return count;
}

async function main() {
  console.log("========================================");
  console.log("Yahoo module 77507 diagnostic");
  console.log("========================================");

  console.log(`KEYWORD: ${keyword}`);
  console.log(`CHUNK: ${chunkUrl}`);

  const result = await fetchText(chunkUrl);

  console.log(`HTTP STATUS: ${result.status}`);
  console.log(`JS LENGTH: ${result.text.length}`);

  const js = result.text;

  /*
   * 1. loadChartData
   */
  console.log("\n");
  console.log("########################################");
  console.log("1. loadChartData");
  console.log("########################################");

  findAll(
    js,
    /loadChartData/g,
    "loadChartData",
    2500,
    8000
  );

  /*
   * 2. 77507 references
   */
  console.log("\n");
  console.log("########################################");
  console.log("2. MODULE 77507 REFERENCES");
  console.log("########################################");

  findAll(
    js,
    /77507/g,
    "77507",
    2500,
    6000
  );

  /*
   * 3. module definition
   */
  console.log("\n");
  console.log("########################################");
  console.log("3. POSSIBLE MODULE DEFINITIONS");
  console.log("########################################");

  findAll(
    js,
    /77507\s*:/g,
    "77507:",
    1000,
    12000
  );

  findAll(
    js,
    /77507\s*[,)]/g,
    "77507 followed by , or )",
    1000,
    5000
  );

  /*
   * 4. N = s(77507)
   */
  console.log("\n");
  console.log("########################################");
  console.log("4. N = s(77507)");
  console.log("########################################");

  findAll(
    js,
    /N\s*=\s*s\s*\(\s*77507\s*\)/g,
    "N = s(77507)",
    3000,
    5000
  );

  /*
   * 5. N.Z
   */
  console.log("\n");
  console.log("########################################");
  console.log("5. N.Z");
  console.log("########################################");

  findAll(
    js,
    /N\.Z/g,
    "N.Z",
    3000,
    7000
  );

  /*
   * 6. sentimentData inside module
   */
  console.log("\n");
  console.log("########################################");
  console.log("6. sentimentData");
  console.log("########################################");

  findAll(
    js,
    /sentimentData/g,
    "sentimentData",
    1200,
    4000
  );

  /*
   * 7. dataPositive / dataNegative
   */
  console.log("\n");
  console.log("########################################");
  console.log("7. dataPositive / dataNegative");
  console.log("########################################");

  findAll(
    js,
    /dataPositive/g,
    "dataPositive",
    1500,
    5000
  );

  findAll(
    js,
    /dataNegative/g,
    "dataNegative",
    1500,
    5000
  );

  /*
   * 8. API-looking strings
   */
  console.log("\n");
  console.log("########################################");
  console.log("8. NETWORK STRINGS");
  console.log("########################################");

  const networkPatterns = [
    /https?:\/\/[^"'\\\s<>()]+/gi,
    /\/api\/[^"'\\\s<>()]+/gi,
    /\/realtime\/[^"'\\\s<>()]+/gi,
    /\/search\/[^"'\\\s<>()]+/gi,
    /\/pagination[^"'\\\s<>()]*/gi,
    /fetch\([^)]{0,500}\)/gi,
    /axios[^,;]{0,500}/gi,
    /XMLHttpRequest[^,;]{0,500}/gi
  ];

  const found = new Set();

  for (const regex of networkPatterns) {
    let match;

    while ((match = regex.exec(js)) !== null) {
      const value = match[0];

      if (
        value.includes("api") ||
        value.includes("realtime") ||
        value.includes("search") ||
        value.includes("pagination") ||
        value.includes("fetch") ||
        value.includes("axios") ||
        value.includes("XMLHttpRequest")
      ) {
        found.add(value);
      }

      if (found.size >= 100) {
        break;
      }
    }
  }

  if (found.size === 0) {
    console.log("(none)");
  } else {
    for (const value of found) {
      console.log(value);
    }
  }

  /*
   * 9. exports
   */
  console.log("\n");
  console.log("########################################");
  console.log("9. EXPORT / MODULE TERMS");
  console.log("########################################");

  for (const term of [
    "module.exports",
    "exports.",
    ".Z=",
    "Z:",
    "default:",
    "async",
    "samplingRate",
    "tweetTransit"
  ]) {
    const count =
      js.toLowerCase().split(
        term.toLowerCase()
      ).length - 1;

    console.log(`${term} COUNT: ${count}`);
  }

  /*
   * 10. Finish
   */
  console.log("\n");
  console.log("========================================");
  console.log("DIAGNOSTIC FINISHED");
  console.log("========================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
