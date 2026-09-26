const pageUrl =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent("ファナック");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/131.0.0.0 Safari/537.36";

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

function printContext(text, pos, before = 700, after = 1800) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo loadChartData COMPLETE SEARCH");
  console.log("==================================================");

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

      if (!js.includes("loadChartData")) {
        continue;
      }

      console.log("\n");
      console.log("##################################################");
      console.log("SCRIPT CONTAINS loadChartData");
      console.log("##################################################");
      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      /*
       * loadChartData の全出現箇所を一つずつ表示
       */
      const regex = /loadChartData/g;

      let match;
      let count = 0;

      while ((match = regex.exec(js)) !== null) {
        count++;

        console.log("\n");
        console.log("==================================================");
        console.log(`LOADCHARTDATA OCCURRENCE #${count}`);
        console.log("==================================================");
        console.log(`POSITION: ${match.index}`);
        console.log(`MATCH: ${match[0]}`);
        console.log("--------------------------------------------------");

        printContext(js, match.index);

        if (count >= 30) {
          console.log("STOP: 30 occurrences reached");
          break;
        }
      }

      console.log("\n");
      console.log("==================================================");
      console.log(`TOTAL LOADCHARTDATA OCCURRENCES: ${count}`);
      console.log("==================================================");

      /*
       * 「loadChartData」の前後に何があるかをさらに分類
       */
      console.log("\n");
      console.log("==================================================");
      console.log("POSSIBLE CALL PATTERNS");
      console.log("==================================================");

      const patterns = [
        /this\.loadChartData/g,
        /\.loadChartData/g,
        /loadChartData\s*\(/g,
        /loadChartData\s*=/g,
        /loadChartData\s*:/g,
        /loadChartData\s*,/g
      ];

      for (const pattern of patterns) {
        pattern.lastIndex = 0;

        let n = 0;

        while ((match = pattern.exec(js)) !== null) {
          n++;

          console.log(
            `PATTERN ${pattern} #${n} POSITION ${match.index}`
          );

          console.log(
            js.slice(
              Math.max(0, match.index - 300),
              Math.min(js.length, match.index + 700)
            )
          );

          if (n >= 10) {
            break;
          }
        }

        console.log(`PATTERN COUNT: ${n}`);
      }
    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  console.log("\n");
  console.log("==================================================");
  console.log("FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
