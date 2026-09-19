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

function printAround(text, pos, before, after) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo loadChartData CALL-SITE diagnostic");
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

      if (!js.includes("loadChartData")) {
        continue;
      }

      console.log("\n");
      console.log("##################################################");
      console.log("LOADCHARTDATA SCRIPT FOUND");
      console.log("##################################################");
      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      let pos = 0;
      let count = 0;

      while ((pos = js.indexOf("loadChartData", pos)) !== -1) {
        count++;

        console.log("\n");
        console.log("==================================================");
        console.log(`LOADCHARTDATA OCCURRENCE ${count}`);
        console.log(`POSITION: ${pos}`);
        console.log("==================================================");

        // loadChartDataのかなり前から表示
        printAround(
          js,
          pos,
          10000,
          10000
        );

        pos += "loadChartData".length;

        if (count >= 3) {
          break;
        }
      }

      console.log("\n");
      console.log(`LOADCHARTDATA COUNT: ${count}`);

      // 今回は最初に見つかった対象スクリプトだけで終了
      break;

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
