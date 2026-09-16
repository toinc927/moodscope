const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const chunkUrl =
  "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/612.js";

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

function context(text, position, before = 3000, after = 5000) {
  return text.slice(
    Math.max(0, position - before),
    Math.min(text.length, position + after)
  );
}

function showMatches(text, regex, label, before = 500, after = 2000) {
  let match;
  let count = 0;

  while ((match = regex.exec(text)) !== null) {
    console.log("\n");
    console.log("########################################");
    console.log(`MATCH: ${label}`);
    console.log(`POSITION: ${match.index}`);
    console.log("########################################");

    console.log(
      context(
        text,
        match.index,
        before,
        after
      )
    );

    count++;

    if (count >= 20) {
      break;
    }
  }

  console.log(`\n${label} COUNT: ${count}`);
}

async function main() {
  console.log("========================================");
  console.log("Yahoo module 77507 deep diagnostic");
  console.log("========================================");

  console.log(`CHUNK: ${chunkUrl}`);

  const result = await fetchText(chunkUrl);

  console.log(`HTTP STATUS: ${result.status}`);
  console.log(`JS LENGTH: ${result.text.length}`);

  const js = result.text;

  /*
   * 1. module 77507
   */
  console.log("\n========================================");
  console.log("1. MODULE 77507");
  console.log("========================================");

  const moduleMatches = [
    /77507\s*:/g,
    /77507\)/g,
    /77507\s*,/g,
    /77507\s*=/g
  ];

  for (const regex of moduleMatches) {
    showMatches(
      js,
      regex,
      regex.source,
      1000,
      7000
    );
  }

  /*
   * 2. module definition
   */
  console.log("\n========================================");
  console.log("2. MODULE DEFINITION AROUND 74438");
  console.log("========================================");

  console.log(
    context(
      js,
      74438,
      3000,
      12000
    )
  );

  /*
   * 3. N require
   */
  console.log("\n========================================");
  console.log("3. N = REQUIRE(77507)");
  console.log("========================================");

  showMatches(
    js,
    /N\s*=\s*s\(77507\)/g,
    "N = s(77507)",
    3000,
    5000
  );

  /*
   * 4. sentiment related
   */
  console.log("\n========================================");
  console.log("4. SENTIMENT TERMS");
  console.log("========================================");

  for (const term of [
    "sentiment",
    "sentimentData",
    "dataPositive",
    "dataNegative",
    "positive",
    "negative"
  ]) {
    console.log(`\n----- ${term} -----`);

    showMatches(
      js,
      new RegExp(term, "gi"),
      term,
      700,
      2500
    );
  }

  /*
   * 5. network-related
   */
  console.log("\n========================================");
  console.log("5. NETWORK / API TERMS");
  console.log("========================================");

  const networkRegexes = [
    /fetch\s*\(/gi,
    /axios/gi,
    /XMLHttpRequest/gi,
    /\/realtime\/api/gi,
    /\/api\/v1/gi,
    /pagination/gi,
    /samplingRate/gi,
    /tweetTransit/gi
  ];

  for (const regex of networkRegexes) {
    showMatches(
      js,
      regex,
      regex.source,
      1200,
      4000
    );
  }

  /*
   * 6. loadChartData
   */
  console.log("\n========================================");
  console.log("6. LOAD CHART DATA");
  console.log("========================================");

  showMatches(
    js,
    /loadChartData\s*=/gi,
    "loadChartData =",
    5000,
    10000
  );

  /*
   * 7. exported Z
   */
  console.log("\n========================================");
  console.log("7. EXPORT / Z PATTERNS");
  console.log("========================================");

  const exportRegexes = [
    /\.Z\s*=/g,
    /Z\s*:/g,
    /exports\.Z/g,
    /return\s+Z/g
  ];

  for (const regex of exportRegexes) {
    showMatches(
      js,
      regex,
      regex.source,
      1500,
      5000
    );
  }

  /*
   * 8. strings that look like API paths
   */
  console.log("\n========================================");
  console.log("8. ALL REALTIME API-LIKE STRINGS");
  console.log("========================================");

  const strings = new Set();

  const apiRegex =
    /["'`]([^"'`]*(?:realtime|api|pagination|stream|sentiment)[^"'`]*)["'`]/gi;

  let m;

  while ((m = apiRegex.exec(js)) !== null) {
    strings.add(m[1]);

    if (strings.size >= 200) {
      break;
    }
  }

  if (strings.size === 0) {
    console.log("(none)");
  } else {
    for (const value of strings) {
      console.log(value);
    }
  }

  console.log("\n========================================");
  console.log("FINISHED");
  console.log("========================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
