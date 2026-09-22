const pageUrl =
  "https://search.yahoo.co.jp/realtime/search?p=%E3%83%95%E3%82%A1%E3%83%8A%E3%83%83%E3%82%AF";

const targetUrl =
  "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/2738.js";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

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

function printAround(text, pos, before = 5000, after = 10000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function findAll(text, regex, label, before = 5000, after = 10000) {
  let count = 0;
  let match;

  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    count++;

    console.log("\n");
    console.log("==================================================");
    console.log(`${label} #${count}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`MATCH: ${match[0]}`);
    console.log("==================================================");

    printAround(text, match.index, before, after);

    if (count >= 10) {
      break;
    }
  }

  console.log(`\n${label} COUNT: ${count}`);

  return count;
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo loadChartData CALL-SITE diagnostic");
  console.log("==================================================");

  const result = await fetchText(targetUrl);

  console.log(`HTTP: ${result.status}`);
  console.log(`JS LENGTH: ${result.text.length}`);

  const js = result.text;

  console.log("\n");
  console.log("##################################################");
  console.log("1. MODULE 77507 IMPORT");
  console.log("##################################################");

  findAll(
    js,
    /(?:r|n|a|s|o|i|c|l|u|d|f|p|h|g|m|v|y|w|b|x|k|j|q|z)=r\(77507\)/g,
    "77507 IMPORT"
  );

  console.log("\n");
  console.log("##################################################");
  console.log("2. TA.Z CALL");
  console.log("##################################################");

  findAll(
    js,
    /\(0,[A-Za-z_$][\w$]*\.Z\)\([^)]*/g,
    "Z CALL"
  );

  console.log("\n");
  console.log("##################################################");
  console.log("3. THIS.LOADCHARTDATA CALL");
  console.log("##################################################");

  findAll(
    js,
    /this\.loadChartData\(/g,
    "THIS.LOADCHARTDATA CALL",
    8000,
    12000
  );

  console.log("\n");
  console.log("##################################################");
  console.log("4. LOADCHARTDATA CALL");
  console.log("##################################################");

  findAll(
    js,
    /loadChartData\(/g,
    "LOADCHARTDATA CALL",
    8000,
    12000
  );

  console.log("\n");
  console.log("##################################################");
  console.log("5. SENTIMENT PIE CHART");
  console.log("##################################################");

  findAll(
    js,
    /sentimentPieChart/g,
    "SENTIMENT PIE CHART",
    4000,
    8000
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
