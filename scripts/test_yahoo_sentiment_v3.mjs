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

function printAround(text, pos, before = 5000, after = 8000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function findAll(text, regex, limit = 30) {
  const hits = [];
  regex.lastIndex = 0;

  let match;

  while ((match = regex.exec(text)) !== null) {
    hits.push({
      index: match.index,
      match: match[0]
    });

    if (hits.length >= limit) {
      break;
    }
  }

  return hits;
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo sentiment CALL-SITE diagnostic");
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

  let found = 0;

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

      // loadChartData を含むファイルだけを見る
      if (!js.includes("loadChartData")) {
        continue;
      }

      console.log("\n");
      console.log("##################################################");
      console.log("LOADCHARTDATA FILE");
      console.log("##################################################");
      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      // 77507 の利用箇所を探す
      const moduleHits = findAll(
        js,
        /(?:r|s|n|o|a|t|e|i|ta|N)\(77507\)/g,
        50
      );

      console.log(`77507 IMPORT-LIKE HITS: ${moduleHits.length}`);

      for (const hit of moduleHits) {
        console.log("\n");
        console.log("--------------------------------------------------");
        console.log("77507 IMPORT CONTEXT");
        console.log(`POSITION: ${hit.index}`);
        console.log("--------------------------------------------------");

        printAround(js, hit.index, 2500, 5000);
      }

      // ta.Z(...) の呼び出しを探す
      const callHits = findAll(
        js,
        /ta\.Z\(/g,
        50
      );

      console.log("\n");
      console.log(`ta.Z CALLS: ${callHits.length}`);

      for (const hit of callHits) {
        console.log("\n");
        console.log("--------------------------------------------------");
        console.log("ta.Z CALL");
        console.log(`POSITION: ${hit.index}`);
        console.log("--------------------------------------------------");

        printAround(js, hit.index, 3500, 6000);
      }

      // loadChartData の呼び出しを探す
      const loadHits = findAll(
        js,
        /loadChartData\s*\(/g,
        50
      );

      console.log("\n");
      console.log(`loadChartData CALLS: ${loadHits.length}`);

      for (const hit of loadHits) {
        console.log("\n");
        console.log("--------------------------------------------------");
        console.log("loadChartData CALL");
        console.log(`POSITION: ${hit.index}`);
        console.log("--------------------------------------------------");

        printAround(js, hit.index, 3500, 6000);
      }

      found++;
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
  console.log(`LOADCHARTDATA FILES: ${found}`);
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
