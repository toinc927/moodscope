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

function printContext(text, position, label) {
  console.log("\n");
  console.log("########################################");
  console.log(label);
  console.log(`POSITION: ${position}`);
  console.log("########################################");

  console.log(
    text.slice(
      Math.max(0, position - 1200),
      Math.min(text.length, position + 3000)
    )
  );
}

async function main() {
  console.log("========================================");
  console.log("Yahoo module 77507 search");
  console.log("========================================");

  console.log(`KEYWORD: ${keyword}`);

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log(`PAGE HTTP: ${page.status}`);
  console.log(`HTML LENGTH: ${page.text.length}`);

  const scripts = findScriptUrls(page.text);

  console.log("\n========================================");
  console.log("EXTERNAL SCRIPTS");
  console.log("========================================");

  console.log(`SCRIPT COUNT: ${scripts.length}`);

  let scanned = 0;
  let hits = 0;

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

      scanned++;

      const js = result.text;

      /*
       * 最重要：
       * module 77507 の定義を探す
       */
      const patterns = [
        /77507\s*:/g,
        /77507\s*=\s*/g,
        /77507\s*,/g,
        /77507\)/g,
        /77507\}/g
      ];

      let foundInThisScript = false;

      for (const regex of patterns) {
        let match;

        while ((match = regex.exec(js)) !== null) {
          foundInThisScript = true;
          hits++;

          printContext(
            js,
            match.index,
            `MODULE 77507 HIT\nURL: ${url}\nMATCH: ${match[0]}`
          );
        }
      }

      /*
       * 77507が見つからなくても、
       * Yahooの取得処理に関係しそうな文字列を確認
       */
      if (
        js.includes("sentimentData") &&
        js.includes("dataPositive")
      ) {
        console.log("\n");
        console.log("########################################");
        console.log("SENTIMENT SCRIPT");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);
        console.log("########################################");

        const terms = [
          "sentimentData",
          "dataPositive",
          "dataNegative",
          "loadChartData",
          "samplingRate"
        ];

        for (const term of terms) {
          const pos = js.indexOf(term);

          if (pos >= 0) {
            printContext(
              js,
              pos,
              `TERM: ${term}`
            );
          }
        }
      }

    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  console.log("\n========================================");
  console.log("SUMMARY");
  console.log("========================================");

  console.log(`SCANNED SCRIPTS: ${scanned}`);
  console.log(`MODULE 77507 HITS: ${hits}`);

  if (hits === 0) {
    console.log(
      "MODULE 77507 was not found in the directly referenced scripts."
    );
    console.log(
      "We may need to discover additional Next.js chunks."
    );
  } else {
    console.log(
      "MODULE 77507 FOUND."
    );
  }

  console.log(
    "\nYahoo module 77507 search finished."
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
