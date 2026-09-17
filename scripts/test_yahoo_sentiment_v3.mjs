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

function printAround(text, position, before = 4000, after = 8000) {
  console.log(
    text.slice(
      Math.max(0, position - before),
      Math.min(text.length, position + after)
    )
  );
}

function findAll(text, regex, label, limit = 20) {
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

async function main() {
  console.log("==================================================");
  console.log("Yahoo loadChartData API diagnostic");
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

  let found = false;

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

      found = true;

      console.log("\n");
      console.log("##################################################");
      console.log("LOADCHARTDATA SCRIPT FOUND");
      console.log("##################################################");

      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      findAll(
        js,
        /loadChartData/gi,
        "loadChartData",
        30
      );

      findAll(
        js,
        /N\.Z/g,
        "N.Z",
        30
      );

      findAll(
        js,
        /sentimentData/gi,
        "sentimentData",
        30
      );

      findAll(
        js,
        /tweetTransit/gi,
        "tweetTransit",
        30
      );

      findAll(
        js,
        /samplingRate/gi,
        "samplingRate",
        30
      );

      findAll(
        js,
        /\/realtime\/api\/v1/gi,
        "/realtime/api/v1",
        30
      );

      console.log("\n");
      console.log("##################################################");
      console.log("LOADCHARTDATA DIAGNOSTIC FINISHED");
      console.log("##################################################");

      break;

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

  console.log(
    `LOADCHARTDATA SCRIPT FOUND: ${found}`
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
