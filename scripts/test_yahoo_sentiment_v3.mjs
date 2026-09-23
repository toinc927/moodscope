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

function printAround(text, pos, before = 10000, after = 15000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function find(text, regex, label, limit = 10) {
  regex.lastIndex = 0;

  let count = 0;
  let match;

  while ((match = regex.exec(text)) !== null && count < limit) {
    console.log("\n");
    console.log("==================================================");
    console.log(label);
    console.log("POSITION:", match.index);
    console.log("MATCH:", match[0]);
    console.log("==================================================");

    printAround(text, match.index);

    count++;
  }

  console.log(`${label} COUNT: ${count}`);
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo sentiment PATH source diagnostic");
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
       * loadChartData の定義
       */
      if (js.includes("this.loadChartData=async")) {
        console.log("\n");
        console.log("##################################################");
        console.log("LOADCHARTDATA DEFINITION");
        console.log("##################################################");
        console.log("URL:", url);
        console.log("JS LENGTH:", js.length);

        find(
          js,
          /this\.loadChartData=async/g,
          "LOADCHARTDATA DEFINITION",
          5
        );
      }

      /*
       * e.path を渡している場所
       */
      if (js.includes("loadChartData(e.path")) {
        console.log("\n");
        console.log("##################################################");
        console.log("E.PATH CALL SITE");
        console.log("##################################################");
        console.log("URL:", url);

        find(
          js,
          /loadChartData\(e\.path/g,
          "E.PATH CALL SITE",
          5
        );
      }

      /*
       * sentimentPieChart と path が近い場所を探す
       */
      if (
        js.includes("sentimentPieChart") &&
        js.includes("loadChartData")
      ) {
        console.log("\n");
        console.log("##################################################");
        console.log("SENTIMENT + LOADCHARTDATA MODULE");
        console.log("##################################################");
        console.log("URL:", url);
        console.log("JS LENGTH:", js.length);

        find(
          js,
          /sentimentPieChart/g,
          "SENTIMENT PIE CHART",
          5
        );
      }

      /*
       * module 77507 の利用箇所
       */
      if (
        js.includes("77507)") ||
        js.includes("77507,")
      ) {
        console.log("\n");
        console.log("##################################################");
        console.log("MODULE 77507 IMPORT / USE");
        console.log("##################################################");
        console.log("URL:", url);

        find(
          js,
          /77507/g,
          "MODULE 77507",
          20
        );
      }

      /*
       * API wrapper
       */
      if (js.includes("/realtime/api/v1")) {
        console.log("\n");
        console.log("##################################################");
        console.log("REALTIME API WRAPPER");
        console.log("##################################################");
        console.log("URL:", url);

        find(
          js,
          /\/realtime\/api\/v1/g,
          "REALTIME API",
          5
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
