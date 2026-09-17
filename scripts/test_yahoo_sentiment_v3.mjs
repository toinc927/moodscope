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

function around(text, pos, before = 5000, after = 8000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function search(text, regex, label, limit = 30) {
  let count = 0;
  let m;

  regex.lastIndex = 0;

  while ((m = regex.exec(text)) !== null && count < limit) {
    console.log("\n");
    console.log("==================================================");
    console.log(`HIT: ${label}`);
    console.log(`POSITION: ${m.index}`);
    console.log(`MATCH: ${m[0]}`);
    console.log("==================================================");

    around(text, m.index);

    count++;
  }

  console.log(`\n${label} COUNT: ${count}`);
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo sentimentData source diagnostic");
  console.log("==================================================");

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log(`PAGE HTTP: ${page.status}`);
  console.log(`HTML LENGTH: ${page.text.length}`);

  const scripts = [
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

  const uniqueScripts = [...new Set(scripts)];

  console.log(`SCRIPT COUNT: ${uniqueScripts.length}`);

  let checked = 0;

  for (const url of uniqueScripts) {
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

      if (
        !js.includes("dataPositive") &&
        !js.includes("dataNegative") &&
        !js.includes("sentimentData")
      ) {
        continue;
      }

      checked++;

      console.log("\n");
      console.log("##################################################");
      console.log("SENTIMENT-RELATED SCRIPT FOUND");
      console.log("##################################################");
      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      search(
        js,
        /dataPositive/gi,
        "dataPositive",
        30
      );

      search(
        js,
        /dataNegative/gi,
        "dataNegative",
        30
      );

      search(
        js,
        /sentimentData/gi,
        "sentimentData",
        30
      );

      search(
        js,
        /sentimentData\s*[:=]/gi,
        "sentimentData assignment",
        30
      );

      search(
        js,
        /dataPositive\s*[:=]/gi,
        "dataPositive assignment",
        30
      );

      search(
        js,
        /dataNegative\s*[:=]/gi,
        "dataNegative assignment",
        30
      );

      search(
        js,
        /positive\s*[:=]/gi,
        "positive assignment",
        30
      );

      search(
        js,
        /negative\s*[:=]/gi,
        "negative assignment",
        30
      );

      search(
        js,
        /\/realtime\/api\/v1/gi,
        "/realtime/api/v1",
        30
      );
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
  console.log(`RELATED SCRIPTS FOUND: ${checked}`);
  console.log("Yahoo sentimentData source diagnostic finished.");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
