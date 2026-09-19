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

function printAround(text, pos, before = 2500, after = 4500) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function findModuleStarts(js) {
  const results = [];

  const regex =
    /(?:^|[,{])(\d+):\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;

  let m;

  while ((m = regex.exec(js)) !== null) {
    results.push({
      id: m[1],
      pos: m.index
    });
  }

  return results;
}

function getModuleAtPosition(js, position) {
  const modules = findModuleStarts(js);

  let current = null;

  for (const mod of modules) {
    if (mod.pos <= position) {
      current = mod;
    } else {
      break;
    }
  }

  return current;
}

function findOccurrences(js, text) {
  const positions = [];
  let pos = 0;

  while ((pos = js.indexOf(text, pos)) !== -1) {
    positions.push(pos);
    pos += text.length;

    if (positions.length >= 30) {
      break;
    }
  }

  return positions;
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo SENTIMENT CALL-SITE diagnostic");
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

      // --------------------------------------------------
      // 75391
      // --------------------------------------------------

      const hits75391 = findOccurrences(js, "75391");

      if (hits75391.length > 0) {
        console.log("\n");
        console.log("##################################################");
        console.log("MODULE 75391 REFERENCES");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`HITS: ${hits75391.length}`);

        for (const pos of hits75391) {
          console.log("\n");
          console.log("----------------------------------------------");
          console.log(`POSITION: ${pos}`);
          console.log("----------------------------------------------");

          printAround(js, pos, 3000, 5000);
        }
      }

      // --------------------------------------------------
      // 77507
      // --------------------------------------------------

      const hits77507 = findOccurrences(js, "77507");

      if (hits77507.length > 0) {
        console.log("\n");
        console.log("##################################################");
        console.log("MODULE 77507 REFERENCES");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`HITS: ${hits77507.length}`);

        for (const pos of hits77507) {
          console.log("\n");
          console.log("----------------------------------------------");
          console.log(`POSITION: ${pos}`);
          console.log("----------------------------------------------");

          printAround(js, pos, 3000, 5000);
        }
      }

      // --------------------------------------------------
      // loadChartData + imports
      // --------------------------------------------------

      if (js.includes("loadChartData")) {
        console.log("\n");
        console.log("##################################################");
        console.log("LOADCHARTDATA + IMPORT DIAGNOSTIC");
        console.log("##################################################");
        console.log(`URL: ${url}`);

        const positions = findOccurrences(js, "loadChartData");

        for (const pos of positions) {
          const mod = getModuleAtPosition(js, pos);

          console.log("\n");
          console.log("----------------------------------------------");
          console.log(`LOADCHARTDATA POSITION: ${pos}`);
          console.log(`MODULE AT POSITION: ${mod ? mod.id : "UNKNOWN"}`);
          console.log("----------------------------------------------");

          printAround(js, pos, 5000, 8000);
        }
      }

      // --------------------------------------------------
      // sentimentData
      // --------------------------------------------------

      if (js.includes("sentimentData")) {
        console.log("\n");
        console.log("##################################################");
        console.log("SENTIMENTDATA MODULE INFO");
        console.log("##################################################");
        console.log(`URL: ${url}`);

        const positions = findOccurrences(js, "sentimentData");

        for (const pos of positions.slice(0, 8)) {
          const mod = getModuleAtPosition(js, pos);

          console.log("\n");
          console.log("----------------------------------------------");
          console.log(`SENTIMENTDATA POSITION: ${pos}`);
          console.log(`MODULE AT POSITION: ${mod ? mod.id : "UNKNOWN"}`);
          console.log("----------------------------------------------");

          printAround(js, pos, 1800, 3000);
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
  console.log("DIAGNOSTIC FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
