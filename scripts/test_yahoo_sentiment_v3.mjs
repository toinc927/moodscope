const pageUrl =
  "https://search.yahoo.co.jp/realtime/search?p=%E3%83%95%E3%82%A1%E3%83%8A%E3%83%83%E3%82%AF";

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

function printContext(text, position, before = 1500, after = 5000) {
  console.log("\n");
  console.log("========================================");
  console.log(`POSITION: ${position}`);
  console.log("========================================");

  console.log(
    text.slice(
      Math.max(0, position - before),
      Math.min(text.length, position + after)
    )
  );
}

function searchAll(text, pattern, label, max = 20) {
  const regex = new RegExp(pattern, "gi");

  let match;
  let count = 0;

  while ((match = regex.exec(text)) !== null && count < max) {
    console.log("\n");
    console.log("########################################");
    console.log(`MATCH: ${label}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`TEXT: ${match[0]}`);
    console.log("########################################");

    printContext(text, match.index);

    count++;

    if (regex.lastIndex === match.index) {
      regex.lastIndex++;
    }
  }

  console.log(`\n${label} COUNT: ${count}`);
}

function findScriptUrls(html) {
  const urls = [
    ...html.matchAll(
      /<script[^>]+src=["']([^"']+)["']/gi
    )
  ].map(m => m[1]);

  return [
    ...new Set(
      urls.map(src =>
        src.startsWith("http")
          ? src
          : new URL(src, pageUrl).href
      )
    )
  ];
}

async function main() {
  console.log("========================================");
  console.log("Yahoo module 77507 diagnostic");
  console.log("========================================");

  // ------------------------------------------
  // 1. Yahooページ取得
  // ------------------------------------------

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log(`PAGE STATUS: ${page.status}`);
  console.log(`HTML LENGTH: ${page.text.length}`);

  // ------------------------------------------
  // 2. script一覧
  // ------------------------------------------

  const scripts = findScriptUrls(page.text);

  console.log("\n");
  console.log("========================================");
  console.log("EXTERNAL SCRIPT LIST");
  console.log("========================================");

  console.log(`SCRIPT COUNT: ${scripts.length}`);

  // ------------------------------------------
  // 3. 612.jsを最優先で調査
  // ------------------------------------------

  const targetChunk =
    "https://s.yimg.jp/images/realtime/fe/assets/_next/static/4.299.2/chunks/612.js";

  const orderedScripts = [
    targetChunk,
    ...scripts.filter(x => x !== targetChunk)
  ];

  let found77507 = false;

  // ------------------------------------------
  // 4. 全JSから77507を探す
  // ------------------------------------------

  for (const url of orderedScripts) {
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

      // 77507という数字そのもの
      if (!js.includes("77507")) {
        continue;
      }

      console.log("\n\n");
      console.log("########################################");
      console.log("######## MODULE 77507 FOUND ########");
      console.log("########################################");

      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      found77507 = true;

      // --------------------------------------
      // 5. 77507: の定義
      // --------------------------------------

      searchAll(
        js,
        "77507\\s*:",
        "77507: MODULE DEFINITION",
        20
      );

      // --------------------------------------
      // 6. 77507に関係するwebpack表記
      // --------------------------------------

      searchAll(
        js,
        "77507\\s*\\)",
        "77507)",
        20
      );

      searchAll(
        js,
        "77507\\s*[,}]",
        "77507 module boundary",
        20
      );

      // --------------------------------------
      // 7. 重要ワード
      // --------------------------------------

      searchAll(
        js,
        "sentimentPieChart",
        "sentimentPieChart",
        30
      );

      searchAll(
        js,
        "sentiment",
        "sentiment",
        30
      );

      searchAll(
        js,
        "positive",
        "positive",
        30
      );

      searchAll(
        js,
        "negative",
        "negative",
        30
      );

      searchAll(
        js,
        "samplingRate",
        "samplingRate",
        30
      );

      // --------------------------------------
      // 8. URL / API候補
      // --------------------------------------

      console.log("\n");
      console.log("========================================");
      console.log("API / URL CANDIDATES");
      console.log("========================================");

      const urlRegex =
        /(?:https?:\/\/|\/api\/|\/realtime\/|\/search\/)[^"'\\\s<>()]+/gi;

      const urls = new Set();

      let match;

      while ((match = urlRegex.exec(js)) !== null) {
        let value = match[0];

        value = value.replace(/[),.;}\]]+$/, "");

        urls.add(value);

        if (urls.size >= 100) {
          break;
        }
      }

      if (urls.size === 0) {
        console.log("(none)");
      } else {
        for (const value of urls) {
          console.log(value);
        }
      }

      // --------------------------------------
      // 9. 最初に見つけた77507だけ詳細調査
      // --------------------------------------

      if (found77507) {
        console.log("\n");
        console.log("========================================");
        console.log("STOPPING AFTER FIRST MODULE 77507");
        console.log("========================================");

        break;
      }

    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  console.log("\n");
  console.log("========================================");
  console.log("FINAL SUMMARY");
  console.log("========================================");

  console.log(
    `MODULE 77507 FOUND: ${found77507}`
  );

  console.log(
    "Yahoo module 77507 diagnostic finished."
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
