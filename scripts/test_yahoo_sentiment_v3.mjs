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

function printAround(text, pos, before = 3500, after = 7000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function findHits(text, regex, label, limit = 20) {
  let count = 0;
  let match;

  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null && count < limit) {
    console.log("\n");
    console.log("==================================================");
    console.log(`HIT: ${label}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`MATCH: ${match[0]}`);
    console.log("==================================================");

    printAround(text, match.index);

    count++;
  }

  console.log(`\n${label} COUNT: ${count}`);
  return count;
}

function getModuleId(text, position) {
  const before = text.slice(0, position);

  const matches = [
    ...before.matchAll(/(?:^|[,{])(\d+):\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/g)
  ];

  if (matches.length === 0) {
    return null;
  }

  return matches[matches.length - 1][1];
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo INTERNAL API / SENTIMENT diagnostic");
  console.log("==================================================");

  console.log(`KEYWORD: ${keyword}`);
  console.log(`PAGE: ${pageUrl}`);

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

  let apiHits = 0;
  let sentimentHits = 0;
  let loadHits = 0;

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
       * 1. /realtime/api/v1 を使っている場所
       */
      if (js.includes("/realtime/api/v1")) {
        apiHits++;

        console.log("\n");
        console.log("##################################################");
        console.log("REALTIME API SCRIPT FOUND");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        const positions = [];
        let p = 0;

        while ((p = js.indexOf("/realtime/api/v1", p)) !== -1) {
          positions.push(p);
          p += 5;

          if (positions.length >= 20) {
            break;
          }
        }

        for (const pos of positions) {
          console.log("\n");
          console.log("--------------------------------------------------");
          console.log("REALTIME API OCCURRENCE");
          console.log(`POSITION: ${pos}`);
          console.log(`MODULE ID: ${getModuleId(js, pos)}`);
          console.log("--------------------------------------------------");

          printAround(js, pos, 5000, 10000);
        }
      }

      /*
       * 2. sentimentData とAPIが同じJSにあるか
       */
      if (
        js.includes("sentimentData") &&
        js.includes("/realtime/api/v1")
      ) {
        sentimentHits++;

        console.log("\n");
        console.log("##################################################");
        console.log("SENTIMENT + API SAME SCRIPT");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        findHits(
          js,
          /sentimentData/gi,
          "sentimentData",
          10
        );
      }

      /*
       * 3. loadChartData
       */
      if (js.includes("loadChartData")) {
        loadHits++;

        console.log("\n");
        console.log("##################################################");
        console.log("LOADCHARTDATA SCRIPT");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        findHits(
          js,
          /loadChartData/gi,
          "loadChartData",
          10
        );
      }

    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  console.log("\n");
  console.log("==================================================");
  console.log("SUMMARY");
  console.log("==================================================");

  console.log(`REALTIME API SCRIPTS: ${apiHits}`);
  console.log(`SENTIMENT + API SCRIPTS: ${sentimentHits}`);
  console.log(`LOADCHARTDATA SCRIPTS: ${loadHits}`);

  console.log("\n");
  console.log("==================================================");
  console.log("DIAGNOSTIC FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
