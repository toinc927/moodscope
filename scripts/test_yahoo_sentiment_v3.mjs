const chunkUrl =
  "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/2738.js";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "*/*"
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

function findAll(text, pattern, label, limit = 30) {
  let count = 0;
  let match;

  pattern.lastIndex = 0;

  while ((match = pattern.exec(text)) !== null && count < limit) {
    console.log("\n");
    console.log("==================================================");
    console.log(label);
    console.log(`POSITION: ${match.index}`);
    console.log(`MATCH: ${match[0]}`);
    console.log("==================================================");

    printAround(text, match.index);

    count++;
  }

  console.log(`\n${label} COUNT: ${count}`);
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo sentiment API call-site diagnostic");
  console.log("==================================================");

  console.log(`URL: ${chunkUrl}`);

  const result = await fetchText(chunkUrl);

  console.log(`HTTP: ${result.status}`);
  console.log(`JS LENGTH: ${result.text.length}`);

  const js = result.text;

  // --------------------------------------------------
  // 1. module 77507 import
  // --------------------------------------------------

  findAll(
    js,
    /[A-Za-z_$][\w$]*=s\(77507\)/g,
    "MODULE 77507 IMPORT",
    20
  );

  // --------------------------------------------------
  // 2. ta.Z / module 77507 の実際の呼び出し
  // --------------------------------------------------

  findAll(
    js,
    /\(0,[A-Za-z_$][\w$]*\.Z\)\(/g,
    "API WRAPPER CALL",
    50
  );

  // --------------------------------------------------
  // 3. ta.Z に関係する loadChartData
  // --------------------------------------------------

  const loadPos = js.indexOf("this.loadChartData=async");

  if (loadPos !== -1) {
    console.log("\n");
    console.log("##################################################");
    console.log("LOADCHARTDATA DEFINITION");
    console.log("##################################################");
    console.log(`POSITION: ${loadPos}`);

    printAround(js, loadPos, 1000, 9000);
  } else {
    console.log("LOADCHARTDATA DEFINITION NOT FOUND");
  }

  // --------------------------------------------------
  // 4. sentimentPieChart
  // --------------------------------------------------

  findAll(
    js,
    /sentimentPieChart/g,
    "SENTIMENT PIE CHART",
    20
  );

  // --------------------------------------------------
  // 5. tweetTransition
  // --------------------------------------------------

  findAll(
    js,
    /tweetTransition/g,
    "TWEET TRANSITION",
    20
  );

  // --------------------------------------------------
  // 6. path: の候補
  // --------------------------------------------------

  findAll(
    js,
    /path\s*:/g,
    "PATH PROPERTY",
    50
  );

  console.log("\n");
  console.log("==================================================");
  console.log("DIAGNOSTIC FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
