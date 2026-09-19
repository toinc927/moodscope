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

function findModuleStart(js, moduleId) {
  const patterns = [
    new RegExp(`(?:^|[,{])${moduleId}:\\\$begin:math:text$e\,t\,r\\\\\\$end:math:text$=>`, "g"),
    new RegExp(`(?:^|[,{])${moduleId}:\\\$begin:math:text$e\,t\,r\\\\\\$end:math:text$=>\\\\{`, "g"),
    new RegExp(`(?:^|[,{])${moduleId}:\\\$begin:math:text$\[\^\)\]\*\\\\\\$end:math:text$=>`, "g")
  ];

  for (const regex of patterns) {
    const m = regex.exec(js);
    if (m) return m.index;
  }

  return -1;
}

function printSection(title, text) {
  console.log("\n");
  console.log("##################################################");
  console.log(title);
  console.log("##################################################");
  console.log(text);
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo MODULE 2738 diagnostic");
  console.log("==================================================");

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

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

      printSection(
        "LOADCHARTDATA SCRIPT FOUND",
        `URL: ${url}\nJS LENGTH: ${js.length}`
      );

      // モジュール2738の開始位置を探す
      const moduleStart = findModuleStart(js, "2738");

      console.log(`MODULE 2738 START: ${moduleStart}`);

      if (moduleStart >= 0) {
        printSection(
          "MODULE 2738 BEGINNING",
          js.slice(
            moduleStart,
            Math.min(js.length, moduleStart + 9000)
          )
        );
      }

      // loadChartData の周辺
      let pos = 0;
      let count = 0;

      while ((pos = js.indexOf("loadChartData", pos)) !== -1) {
        count++;

        printSection(
          `LOADCHARTDATA OCCURRENCE ${count}`,
          js.slice(
            Math.max(0, pos - 1500),
            Math.min(js.length, pos + 4000)
          )
        );

        pos += "loadChartData".length;

        if (count >= 5) break;
      }

      break;
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
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
