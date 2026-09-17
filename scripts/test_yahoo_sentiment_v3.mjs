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

function printSection(title, text, maxLength = 7000) {
  console.log("\n");
  console.log("==================================================");
  console.log(title);
  console.log("==================================================");

  if (text.length > maxLength) {
    console.log(text.slice(0, maxLength));
    console.log("\n... OUTPUT TRUNCATED ...");
  } else {
    console.log(text);
  }
}

function printAround(text, position, before = 2500, after = 5000) {
  console.log(
    text.slice(
      Math.max(0, position - before),
      Math.min(text.length, position + after)
    )
  );
}

function findAll(text, pattern, label, limit = 30) {
  let count = 0;
  let match;

  while ((match = pattern.exec(text)) !== null && count < limit) {
    console.log("\n");
    console.log("--------------------------------------------------");
    console.log(`HIT: ${label}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`MATCH: ${match[0]}`);
    console.log("--------------------------------------------------");

    printAround(text, match.index, 1800, 3500);

    count++;
  }

  console.log(`\n${label} COUNT: ${count}`);
  return count;
}

function extractModule(text, moduleId) {
  const marker = `${moduleId}:`;

  const start = text.indexOf(marker);

  if (start < 0) {
    return null;
  }

  /*
   * webpackのモジュールは概ね
   *
   * 77507:(e,t,s)=>{ ... },
   *
   * のように並んでいる。
   *
   * 次の「数字:」を探して、77507の範囲を切り出す。
   */

  const nextModuleRegex =
    /,\s*(\d+):\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/g;

  nextModuleRegex.lastIndex = start + marker.length;

  const next = nextModuleRegex.exec(text);

  const end = next
    ? next.index
    : Math.min(text.length, start + 50000);

  return {
    start,
    end,
    text: text.slice(start, end)
  };
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo sentiment module 77507 deep diagnostic");
  console.log("==================================================");

  console.log(`KEYWORD: ${keyword}`);
  console.log(`PAGE: ${pageUrl}`);

  /*
   * ------------------------------------------------
   * 1. Yahooページ取得
   * ------------------------------------------------
   */

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log(`\nPAGE HTTP: ${page.status}`);
  console.log(`HTML LENGTH: ${page.text.length}`);

  /*
   * ------------------------------------------------
   * 2. script URL取得
   * ------------------------------------------------
   */

  const scriptUrls = [
    ...page.text.matchAll(
      /<script[^>]+src=["']([^"']+)["']/gi
    )
  ].map(m => m[1])
   .map(src =>
      src.startsWith("http")
        ? src
        : new URL(src, pageUrl).href
   );

  const scripts = [...new Set(scriptUrls)];

  console.log(`SCRIPT COUNT: ${scripts.length}`);

  /*
   * ------------------------------------------------
   * 3. module 77507を探す
   * ------------------------------------------------
   */

  const MODULE_ID = "77507";

  let moduleFound = false;

  for (const url of scripts) {
    try {
      const result = await fetchText(url, {
        "Accept":
          "application/javascript,text/javascript,*/*;q=0.1",
        "Referer": pageUrl
      });

      if (
        result.status < 200 ||
        result.status >= 300
      ) {
        continue;
      }

      const js = result.text;

      if (!js.includes(`${MODULE_ID}:`)) {
        continue;
      }

      moduleFound = true;

      console.log("\n");
      console.log("##################################################");
      console.log("MODULE 77507 FOUND");
      console.log("##################################################");

      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      const module = extractModule(js, MODULE_ID);

      if (!module) {
        console.log("MODULE EXTRACTION FAILED");
        continue;
      }

      console.log(`MODULE START: ${module.start}`);
      console.log(`MODULE END: ${module.end}`);
      console.log(`MODULE LENGTH: ${module.text.length}`);

      /*
       * ------------------------------------------------
       * 4. module 77507全文の重要語を検索
       * ------------------------------------------------
       */

      findAll(
        module.text,
        /loadChartData/gi,
        "loadChartData",
        20
      );

      findAll(
        module.text,
        /sentimentData/gi,
        "sentimentData",
        30
      );

      findAll(
        module.text,
        /tweetTransit/gi,
        "tweetTransit",
        30
      );

      findAll(
        module.text,
        /samplingRate/gi,
        "samplingRate",
        30
      );

      findAll(
        module.text,
        /N\.Z/g,
        "N.Z",
        30
      );

      /*
       * ------------------------------------------------
       * 5. fetch / axios / XMLHttpRequest
       * ------------------------------------------------
       */

      findAll(
        module.text,
        /\bfetch\s*\(/gi,
        "fetch(",
        30
      );

      findAll(
        module.text,
        /\baxios\b/gi,
        "axios",
        30
      );

      findAll(
        module.text,
        /XMLHttpRequest/gi,
        "XMLHttpRequest",
        30
      );

      /*
       * ------------------------------------------------
       * 6. APIっぽい文字列
       * ------------------------------------------------
       */

      findAll(
        module.text,
        /\/api\/[^"'`\\\s)]+/gi,
        "/api/...",
        30
      );

      findAll(
        module.text,
        /\/realtime\/[^"'`\\\s)]+/gi,
        "/realtime/...",
        30
      );

      findAll(
        module.text,
        /https?:\/\/[^"'`\\\s)]+/gi,
        "https://...",
        30
      );

      /*
       * ------------------------------------------------
       * 7. sentimentDataの周辺を特に広く表示
       * ------------------------------------------------
       */

      const sentimentPosition =
        module.text.indexOf("sentimentData");

      if (sentimentPosition >= 0) {
        printSection(
          "IMPORTANT: FIRST sentimentData CONTEXT",
          module.text.slice(
            Math.max(0, sentimentPosition - 5000),
            Math.min(
              module.text.length,
              sentimentPosition + 10000
            )
          ),
          16000
        );
      }

      /*
       * ------------------------------------------------
       * 8. loadChartDataの周辺を特に広く表示
       * ------------------------------------------------
       */

      const chartPosition =
        module.text.indexOf("loadChartData");

      if (chartPosition >= 0) {
        printSection(
          "IMPORTANT: loadChartData CONTEXT",
          module.text.slice(
            Math.max(0, chartPosition - 5000),
            Math.min(
              module.text.length,
              chartPosition + 15000
            )
          ),
          22000
        );
      }

      /*
       * ------------------------------------------------
       * 9. module 77507 全体の先頭
       * ------------------------------------------------
       */

      printSection(
        "MODULE 77507 START",
        module.text.slice(0, 12000),
        12000
      );

      console.log("\n");
      console.log("##################################################");
      console.log("MODULE 77507 ANALYSIS FINISHED");
      console.log("##################################################");

      /*
       * moduleが見つかったので、
       * 他の大量のJSは調べなくてよい。
       */
      break;

    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  /*
   * ------------------------------------------------
   * 10. 結果
   * ------------------------------------------------
   */

  console.log("\n");
  console.log("==================================================");
  console.log("SUMMARY");
  console.log("==================================================");

  console.log(
    `MODULE 77507 FOUND: ${moduleFound}`
  );

  console.log(
    "Yahoo module 77507 deep diagnostic finished."
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
