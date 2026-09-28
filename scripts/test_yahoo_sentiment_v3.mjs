const pageUrl =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent("ファナック");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/131.0.0.0 Safari/537.36";

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

function printAround(text, pos, before = 2500, after = 5000) {
  console.log(
    text.slice(
      Math.max(0, pos - before),
      Math.min(text.length, pos + after)
    )
  );
}

function printHits(text, regex, label, limit = 30) {
  regex.lastIndex = 0;

  let count = 0;
  let match;

  while ((match = regex.exec(text)) !== null && count < limit) {
    console.log("");
    console.log("==================================================");
    console.log(`${label} #${count + 1}`);
    console.log("==================================================");
    console.log(`POSITION: ${match.index}`);
    console.log(`MATCH: ${match[0]}`);
    console.log("--------------------------------------------------");

    printAround(text, match.index);

    count++;
  }

  console.log("");
  console.log(`${label} COUNT: ${count}`);
}

async function main() {
  console.log("==================================================");
  console.log("Yahoo transition.path diagnostic");
  console.log("==================================================");

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

      if (
        js.includes("loadChartData") ||
        js.includes("sentimentPieChart") ||
        js.includes("this.props.transition")
      ) {
        console.log("");
        console.log("##################################################");
        console.log("TARGET SCRIPT");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        printHits(
          js,
          /this\.loadChartData\s*\(\s*e\.path/g,
          "LOADCHARTDATA E.PATH",
          10
        );

        printHits(
          js,
          /this\.props\.transition/g,
          "THIS.PROPS.TRANSITION",
          20
        );

        printHits(
          js,
          /transition\s*:/g,
          "TRANSITION PROPERTY",
          30
        );

        printHits(
          js,
          /path\s*:/g,
          "PATH PROPERTY",
          50
        );

        printHits(
          js,
          /\.path\b/g,
          "DOT PATH",
          50
        );

        printHits(
          js,
          /loadChartData\s*\(\s*e\.path/g,
          "LOADCHARTDATA E.PATH DIRECT",
          10
        );
      }

    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  console.log("");
  console.log("==================================================");
  console.log("FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
