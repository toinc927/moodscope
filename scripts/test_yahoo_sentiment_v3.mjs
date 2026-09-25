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

function printAround(text, pos, before = 2500, after = 5000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo loadChartData call-site diagnostic");
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

      if (
        !js.includes("loadChartData") &&
        !js.includes("sentimentPieChart")
      ) {
        continue;
      }

      console.log("\n");
      console.log("##################################################");
      console.log("TARGET SCRIPT");
      console.log("##################################################");
      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      /*
       * loadChartData の全出現箇所を調査
       */
      let regex = /loadChartData/g;
      let match;
      let count = 0;

      while ((match = regex.exec(js)) !== null) {
        count++;

        console.log("\n");
        console.log("==================================================");
        console.log(`LOADCHARTDATA OCCURRENCE #${count}`);
        console.log("==================================================");
        console.log(`POSITION: ${match.index}`);

        const start = Math.max(0, match.index - 800);
        const end = Math.min(js.length, match.index + 1800);

        console.log(js.slice(start, end));

        if (count >= 20) {
          break;
        }
      }

      console.log(`\nTOTAL SHOWN: ${count}`);

      /*
       * .loadChartData(
       * を直接探す
       */
      regex = /\.loadChartData\s*\(/g;
      count = 0;

      while ((match = regex.exec(js)) !== null) {
        count++;

        console.log("\n");
        console.log("##################################################");
        console.log(`DIRECT CALL #${count}`);
        console.log("##################################################");
        console.log(`POSITION: ${match.index}`);

        printAround(js, match.index, 1500, 5000);

        if (count >= 20) {
          break;
        }
      }

      console.log(`\nDIRECT CALLS SHOWN: ${count}`);

      /*
       * loadChartData.call / apply
       */
      regex = /loadChartData\s*\.\s*(call|apply)\s*\(/g;
      count = 0;

      while ((match = regex.exec(js)) !== null) {
        count++;

        console.log("\n");
        console.log("##################################################");
        console.log(`CALL/APPLY #${count}`);
        console.log("##################################################");
        console.log(`POSITION: ${match.index}`);

        printAround(js, match.index, 1500, 5000);

        if (count >= 20) {
          break;
        }
      }

      /*
       * sentimentPieChart 周辺
       */
      regex = /sentimentPieChart/g;
      count = 0;

      while ((match = regex.exec(js)) !== null) {
        count++;

        console.log("\n");
        console.log("==================================================");
        console.log(`SENTIMENT PIE #${count}`);
        console.log("==================================================");
        console.log(`POSITION: ${match.index}`);

        printAround(js, match.index, 1500, 4000);

        if (count >= 10) {
          break;
        }
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
