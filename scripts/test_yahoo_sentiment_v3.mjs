const chunkUrl =
  "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/612.js";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "application/javascript,text/javascript,*/*;q=0.1"
    }
  });

  return {
    status: res.status,
    text: await res.text()
  };
}

function printContext(text, position, before = 1500, after = 3500) {
  console.log("\n");
  console.log("========================================");
  console.log(`POSITION: ${position}`);
  console.log("========================================");

  console.log(
    text.slice(
      Math.max(0, position - before),
      Math.min(text.length, position + after)
    )
  );
}

function printMatches(text, regex, label, max = 30) {
  let match;
  let count = 0;

  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null && count < max) {
    console.log("\n");
    console.log("########################################");
    console.log(`MATCH: ${label}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`TEXT: ${match[0]}`);
    console.log("########################################");

    printContext(text, match.index, 1200, 3000);

    count++;

    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
  }

  console.log(`\n${label} COUNT: ${count}`);
}

async function main() {
  console.log("========================================");
  console.log("Yahoo N.Z SOURCE DIAGNOSTIC");
  console.log("========================================");

  console.log(`CHUNK: ${chunkUrl}`);

  const result = await fetchText(chunkUrl);

  console.log(`HTTP STATUS: ${result.status}`);
  console.log(`JS LENGTH: ${result.text.length}`);

  if (result.status < 200 || result.status >= 300) {
    throw new Error("Yahoo chunk could not be fetched.");
  }

  const js = result.text;

  // --------------------------------------------------
  // 1. loadChartData
  // --------------------------------------------------

  console.log("\n");
  console.log("========================================");
  console.log("1. loadChartData");
  console.log("========================================");

  const loadPos = js.indexOf("loadChartData");

  if (loadPos >= 0) {
    console.log(`FOUND loadChartData AT: ${loadPos}`);
    printContext(js, loadPos, 3000, 6000);
  } else {
    console.log("loadChartData NOT FOUND");
  }

  // --------------------------------------------------
  // 2. N.Z occurrences
  // --------------------------------------------------

  console.log("\n");
  console.log("========================================");
  console.log("2. N.Z OCCURRENCES");
  console.log("========================================");

  printMatches(
    js,
    /N\.Z/g,
    "N.Z",
    50
  );

  // --------------------------------------------------
  // 3. Possible definition of N
  // --------------------------------------------------

  console.log("\n");
  console.log("========================================");
  console.log("3. POSSIBLE N DEFINITIONS");
  console.log("========================================");

  printMatches(
    js,
    /(?:var|let|const)\s+N\s*=/g,
    "var/let/const N =",
    50
  );

  printMatches(
    js,
    /N\s*=\s*[a-zA-Z_$][\w$]*\(/g,
    "N = function(...)",
    50
  );

  printMatches(
    js,
    /N\s*=\s*[a-zA-Z_$][\w$]*\(/g,
    "N = xxx(...)",
    50
  );

  // --------------------------------------------------
  // 4. Webpack-style module references
  // --------------------------------------------------

  console.log("\n");
  console.log("========================================");
  console.log("4. WEBPACK MODULE REFERENCES");
  console.log("========================================");

  printMatches(
    js,
    /N\s*=\s*[a-zA-Z_$][\w$]*\(\d+\)/g,
    "N = require(NUMBER)",
    100
  );

  printMatches(
    js,
    /[a-zA-Z_$][\w$]*\(\d+\)\.Z/g,
    "require(NUMBER).Z",
    100
  );

  // --------------------------------------------------
  // 5. sentimentPieChart
  // --------------------------------------------------

  console.log("\n");
  console.log("========================================");
  console.log("5. sentimentPieChart");
  console.log("========================================");

  printMatches(
    js,
    /sentimentPieChart/g,
    "sentimentPieChart",
    30
  );

  // --------------------------------------------------
  // 6. tweetTransition
  // --------------------------------------------------

  console.log("\n");
  console.log("========================================");
  console.log("6. tweetTransition");
  console.log("========================================");

  printMatches(
    js,
    /tweetTransition/g,
    "tweetTransition",
    30
  );

  // --------------------------------------------------
  // 7. samplingRate
  // --------------------------------------------------

  console.log("\n");
  console.log("========================================");
  console.log("7. samplingRate");
  console.log("========================================");

  printMatches(
    js,
    /samplingRate/g,
    "samplingRate",
    30
  );

  // --------------------------------------------------
  // 8. API-looking strings
  // --------------------------------------------------

  console.log("\n");
  console.log("========================================");
  console.log("8. API / DATA URL STRINGS");
  console.log("========================================");

  const urlRegex =
    /(?:https?:\/\/|\/api\/|\/realtime\/|\/search\/)[^"'\\\s<>()]+/gi;

  const urls = new Set();

  let match;

  while ((match = urlRegex.exec(js)) !== null) {
    let value = match[0];

    value = value.replace(/[),.;}\]]+$/, "");

    urls.add(value);

    if (urls.size >= 100) {
      break;
    }
  }

  if (urls.size === 0) {
    console.log("(none)");
  } else {
    for (const url of urls) {
      console.log(url);
    }
  }

  console.log("\n");
  console.log("========================================");
  console.log("DIAGNOSTIC FINISHED");
  console.log("========================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
