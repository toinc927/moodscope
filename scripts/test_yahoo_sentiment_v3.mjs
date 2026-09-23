const pageUrl =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent("ファナック");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

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

function around(text, pos, before = 5000, after = 10000) {
  return text.slice(
    Math.max(0, pos - before),
    Math.min(text.length, pos + after)
  );
}

function printHits(text, regex, label, limit = 20) {
  regex.lastIndex = 0;

  let count = 0;
  let m;

  while ((m = regex.exec(text)) !== null && count < limit) {
    console.log("\n");
    console.log("==================================================");
    console.log(label);
    console.log("POSITION:", m.index);
    console.log("MATCH:", m[0]);
    console.log("==================================================");
    console.log(around(text, m.index));

    count++;
  }

  console.log(`${label} COUNT: ${count}`);
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo sentiment PATH diagnostic");
  console.log("==================================================");

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log("PAGE HTTP:", page.status);
  console.log("HTML LENGTH:", page.text.length);

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

  console.log("SCRIPT COUNT:", scripts.length);

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

      /*
       * 1. loadChartData
       */
      if (js.includes("this.loadChartData")) {
        console.log("\n");
        console.log("##################################################");
        console.log("LOADCHARTDATA FOUND");
        console.log("##################################################");
        console.log("URL:", url);
        console.log("JS LENGTH:", js.length);

        printHits(
          js,
          /this\.loadChartData\(/g,
          "THIS.LOADCHARTDATA"
        );
      }

      /*
       * 2. e.path
       */
      if (
        js.includes("loadChartData(e.path") ||
        js.includes("loadChartData(e.path,")
      ) {
        console.log("\n");
        console.log("##################################################");
        console.log("LOADCHARTDATA E.PATH FOUND");
        console.log("##################################################");
        console.log("URL:", url);

        printHits(
          js,
          /loadChartData\(e\.path/g,
          "LOADCHARTDATA(E.PATH)"
        );
      }

      /*
       * 3. path: の定義
       */
      if (
        js.includes("path:") &&
        js.includes("sentiment")
      ) {
        console.log("\n");
        console.log("##################################################");
        console.log("PATH + SENTIMENT SCRIPT");
        console.log("##################################################");
        console.log("URL:", url);

        printHits(
          js,
          /path\s*:/g,
          "PATH DEFINITION",
          30
        );
      }

      /*
       * 4. sentimentPieChart
       */
      if (js.includes("sentimentPieChart")) {
        console.log("\n");
        console.log("##################################################");
        console.log("SENTIMENT PIE CHART SCRIPT");
        console.log("##################################################");
        console.log("URL:", url);

        printHits(
          js,
          /sentimentPieChart/g,
          "SENTIMENT PIE CHART",
          10
        );
      }

      /*
       * 5. termParams
       */
      if (js.includes("termParams")) {
        console.log("\n");
        console.log("##################################################");
        console.log("TERMPARAMS SCRIPT");
        console.log("##################################################");
        console.log("URL:", url);

        printHits(
          js,
          /termParams/g,
          "TERMPARAMS",
          10
        );
      }

      /*
       * 6. API wrapper
       */
      if (js.includes("/realtime/api/v1")) {
        console.log("\n");
        console.log("##################################################");
        console.log("REALTIME API WRAPPER");
        console.log("##################################################");
        console.log("URL:", url);

        printHits(
          js,
          /\/realtime\/api\/v1/g,
          "REALTIME API",
          10
        );
      }
    } catch (error) {
      console.log(
        "SCRIPT ERROR:",
        url,
        error.message
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
