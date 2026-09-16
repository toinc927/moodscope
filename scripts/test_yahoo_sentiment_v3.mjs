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

function printContext(text, position, before = 1200, after = 3500) {
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

function findAllPositions(text, needle, limit = 50) {
  const positions = [];
  let start = 0;

  while (positions.length < limit) {
    const pos = text.indexOf(needle, start);

    if (pos < 0) {
      break;
    }

    positions.push(pos);
    start = pos + needle.length;
  }

  return positions;
}

async function main() {
  console.log("========================================");
  console.log("Yahoo module 77507 full search");
  console.log("========================================");

  // ------------------------------------------
  // 1. Yahooページ
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
  console.log("SCRIPT LIST");
  console.log("========================================");

  console.log(`SCRIPT COUNT: ${scripts.length}`);

  // ------------------------------------------
  // 3. 全JSを調査
  // ------------------------------------------

  let moduleReferenceCount = 0;
  let moduleDefinitionCount = 0;

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

      // 77507を含まないJSはスキップ
      if (!js.includes("77507")) {
        continue;
      }

      console.log("\n\n");
      console.log("########################################");
      console.log("######## 77507 FOUND IN SCRIPT ########");
      console.log("########################################");

      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      // --------------------------------------
      // A. 77507: 本体定義
      // --------------------------------------

      const definitionPatterns = [
        "77507:",
        "77507:function",
        "77507=(",
        "77507 ="
      ];

      let hasDefinition = false;

      for (const pattern of definitionPatterns) {
        const positions =
          findAllPositions(js, pattern, 20);

        if (positions.length > 0) {
          hasDefinition = true;

          console.log("\n");
          console.log("########################################");
          console.log("######## MODULE DEFINITION ########");
          console.log("########################################");

          console.log(
            `PATTERN: ${pattern}`
          );

          console.log(
            `COUNT: ${positions.length}`
          );

          for (const position of positions) {
            console.log("\n");
            console.log(
              `DEFINITION POSITION: ${position}`
            );

            printContext(
              js,
              position,
              1000,
              6000
            );
          }
        }
      }

      if (hasDefinition) {
        moduleDefinitionCount++;
      }

      // --------------------------------------
      // B. 77507) 参照
      // --------------------------------------

      const referencePositions =
        findAllPositions(js, "77507)", 50);

      if (referencePositions.length > 0) {
        moduleReferenceCount +=
          referencePositions.length;

        console.log("\n");
        console.log("########################################");
        console.log("######## MODULE REFERENCES ########");
        console.log("########################################");

        console.log(
          `REFERENCE COUNT: ${referencePositions.length}`
        );

        for (const position of referencePositions) {
          console.log("\n");
          console.log(
            `REFERENCE POSITION: ${position}`
          );

          printContext(
            js,
            position,
            1200,
            3500
          );
        }
      }

      // --------------------------------------
      // C. sentimentPieChart
      // --------------------------------------

      if (js.includes("sentimentPieChart")) {
        console.log("\n");
        console.log("########################################");
        console.log("######## sentimentPieChart ########");
        console.log("########################################");

        const positions =
          findAllPositions(
            js,
            "sentimentPieChart",
            20
          );

        console.log(
          `COUNT: ${positions.length}`
        );

        for (const position of positions) {
          console.log("\n");
          console.log(
            `POSITION: ${position}`
          );

          printContext(
            js,
            position,
            800,
            3000
          );
        }
      }

      // --------------------------------------
      // D. APIっぽいURL
      // --------------------------------------

      console.log("\n");
      console.log("========================================");
      console.log("API / DATA URL CANDIDATES");
      console.log("========================================");

      const urlRegex =
        /(?:https?:\/\/|\/api\/|\/realtime\/|\/search\/)[^"'\\\s<>()]+/gi;

      const urls = new Set();

      let match;

      while ((match = urlRegex.exec(js)) !== null) {
        let value = match[0];

        value = value.replace(
          /[),.;}\]]+$/,
          ""
        );

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
    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  // ------------------------------------------
  // 4. 結果
  // ------------------------------------------

  console.log("\n\n");
  console.log("========================================");
  console.log("FINAL SUMMARY");
  console.log("========================================");

  console.log(
    `MODULE DEFINITION SCRIPT COUNT: ${moduleDefinitionCount}`
  );

  console.log(
    `MODULE REFERENCE COUNT: ${moduleReferenceCount}`
  );

  console.log(
    "Yahoo module 77507 full search finished."
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
