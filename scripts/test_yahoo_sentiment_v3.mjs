const keyword = "ファナック";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const pageUrl =
  `https://search.yahoo.co.jp/realtime/search?p=${encodeURIComponent(keyword)}`;

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

function printAround(text, pos, before = 3000, after = 6000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function findAll(text, regex, label, limit = 20) {
  let count = 0;
  let match;

  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null && count < limit) {
    console.log("\n");
    console.log("==================================================");
    console.log(`${label} #${count + 1}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`MATCH: ${match[0]}`);
    console.log("==================================================");

    printAround(text, match.index);

    count++;
  }

  console.log(`\n${label} COUNT: ${count}`);
  return count;
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo sentiment call-site diagnostic");
  console.log("==================================================");

  console.log(`KEYWORD: ${keyword}`);

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log(`PAGE HTTP: ${page.status}`);
  console.log(`HTML LENGTH: ${page.text.length}`);

  const scriptUrls = [
    ...page.text.matchAll(
      /<script[^>]+src=["']([^"']+)["']/gi
    )
  ]
    .map(m => m[1])
    .map(src =>
      src.startsWith("http")
        ? src
        : new URL(src, pageUrl).href
    );

  const scripts = [...new Set(scriptUrls)];

  console.log(`SCRIPT COUNT: ${scripts.length}`);

  for (const url of scripts) {
    try {
      const result = await fetchText(url, {
        "Accept":
          "application/javascript,text/javascript,*/*;q=0.1",
        "Referer": pageUrl
      });

      if (result.status < 200 || result.status >= 300) {
        continue;
      }

      const js = result.text;

      // ① 77507を呼び出している場所
      if (
        js.includes("77507") &&
        (
          js.includes("s(77507)") ||
          js.includes("r(77507)") ||
          js.includes("77507)")
        )
      ) {
        console.log("\n");
        console.log("##################################################");
        console.log("MODULE 77507 IMPORTER");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        findAll(
          js,
          /(?:s|r)\(77507\)/g,
          "77507 IMPORT",
          10
        );
      }

      // ② this.loadChartData(...) の実際の呼び出し
      if (js.includes("this.loadChartData")) {
        console.log("\n");
        console.log("##################################################");
        console.log("THIS.LOADCHARTDATA CALL");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        findAll(
          js,
          /this\.loadChartData\s*\(/g,
          "this.loadChartData",
          20
        );
      }

      // ③ loadChartData(...) の呼び出し
      if (js.includes("loadChartData(")) {
        console.log("\n");
        console.log("##################################################");
        console.log("LOADCHARTDATA CALL-SITES");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        findAll(
          js,
          /(?:^|[^\w])loadChartData\s*\(/g,
          "loadChartData(",
          30
        );
      }

    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  console.log("\n");
  console.log("==================================================");
  console.log("DIAGNOSTIC FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
