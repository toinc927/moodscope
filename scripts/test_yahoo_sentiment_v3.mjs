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

function printAround(text, pos, before = 3000, after = 5000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function findAll(text, needle, limit = 20) {
  const positions = [];
  let pos = 0;

  while ((pos = text.indexOf(needle, pos)) !== -1) {
    positions.push(pos);
    pos += needle.length;

    if (positions.length >= limit) break;
  }

  return positions;
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo SENTIMENT API CALL diagnostic");
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

      console.log("\n");
      console.log("##################################################");
      console.log("TARGET SCRIPT");
      console.log("##################################################");
      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      // ------------------------------------------------
      // loadChartData
      // ------------------------------------------------

      const loadPositions = findAll(js, "loadChartData");

      console.log("\n");
      console.log("LOADCHARTDATA POSITIONS:");
      console.log(loadPositions);

      for (const pos of loadPositions) {
        console.log("\n");
        console.log("==================================================");
        console.log("LOADCHARTDATA CONTEXT");
        console.log(`POSITION: ${pos}`);
        console.log("==================================================");

        printAround(js, pos, 5000, 7000);
      }

      // ------------------------------------------------
      // ta.Z
      // ------------------------------------------------

      const taZPositions = findAll(js, "ta.Z");

      console.log("\n");
      console.log("ta.Z POSITIONS:");
      console.log(taZPositions);

      for (const pos of taZPositions) {
        console.log("\n");
        console.log("==================================================");
        console.log("ta.Z CALL CONTEXT");
        console.log(`POSITION: ${pos}`);
        console.log("==================================================");

        printAround(js, pos, 3000, 5000);
      }

      // ------------------------------------------------
      // samplingRate
      // ------------------------------------------------

      const samplingPositions = findAll(js, "samplingRate");

      console.log("\n");
      console.log("samplingRate POSITIONS:");
      console.log(samplingPositions);

      for (const pos of samplingPositions) {
        console.log("\n");
        console.log("==================================================");
        console.log("samplingRate CONTEXT");
        console.log(`POSITION: ${pos}`);
        console.log("==================================================");

        printAround(js, pos, 3000, 5000);
      }

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
