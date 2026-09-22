const pageUrl =
  "https://search.yahoo.co.jp/realtime/search?p=%E3%83%95%E3%82%A1%E3%83%8A%E3%83%83%E3%82%AF";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "*/*",
      "Referer": pageUrl
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

async function main() {
  console.log("==================================================");
  console.log("Yahoo loadChartData REAL CALL diagnostic");
  console.log("==================================================");

  const page = await fetchText(pageUrl);

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

  let totalLoad = 0;
  let realCalls = 0;
  let apiModules = 0;

  for (const url of scripts) {
    try {
      const result = await fetchText(url);

      if (result.status < 200 || result.status >= 300) {
        continue;
      }

      const js = result.text;

      /*
       * --------------------------------------------------
       * 1. loadChartData の全出現を調べる
       * --------------------------------------------------
       */

      let pos = 0;

      while ((pos = js.indexOf("loadChartData(", pos)) !== -1) {

        totalLoad++;

        const before = js.slice(
          Math.max(0, pos - 120)
        );

        const after = js.slice(
          pos,
          Math.min(js.length, pos + 500)
        );

        /*
         * 関数定義は除外
         */
        const isDefinition =
          js.slice(
            Math.max(0, pos - 30),
            pos
          ).includes("this.loadChartData=") ||
          js.slice(
            Math.max(0, pos - 30),
            pos
          ).includes("loadChartData=");

        if (!isDefinition) {

          realCalls++;

          console.log("\n");
          console.log("##################################################");
          console.log("REAL loadChartData CALL");
          console.log("##################################################");
          console.log(`URL: ${url}`);
          console.log(`JS LENGTH: ${js.length}`);
          console.log(`POSITION: ${pos}`);
          console.log("--------------------------------------------------");
          console.log("BEFORE:");
          console.log(before);
          console.log("--------------------------------------------------");
          console.log("CALL + AFTER:");
          console.log(after);
          console.log("--------------------------------------------------");
          console.log("FULL CONTEXT:");
          printAround(js, pos, 3000, 7000);
          console.log("##################################################");
        }

        pos += 5;

        if (totalLoad >= 100) {
          break;
        }
      }

      /*
       * --------------------------------------------------
       * 2. module 77507 の利用箇所
       * --------------------------------------------------
       */

      if (
        /(?:r|n|a|s|o|i|c|l|u|d|f|p|h|g|m|v|y|w|b|x|k|j|q|z)=r\(77507\)/.test(js)
      ) {

        apiModules++;

        console.log("\n");
        console.log("##################################################");
        console.log("MODULE 77507 IMPORTER");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        const regex =
          /(?:r|n|a|s|o|i|c|l|u|d|f|p|h|g|m|v|y|w|b|x|k|j|q|z)=r\(77507\)/g;

        let match;
        let count = 0;

        while ((match = regex.exec(js)) !== null) {

          count++;

          console.log("\n");
          console.log(`77507 IMPORT #${count}`);
          console.log(`POSITION: ${match.index}`);
          console.log(`MATCH: ${match[0]}`);

          printAround(
            js,
            match.index,
            3000,
            5000
          );

          if (count >= 10) {
            break;
          }
        }
      }

      /*
       * --------------------------------------------------
       * 3. /realtime/api/v1
       * --------------------------------------------------
       */

      if (js.includes("/realtime/api/v1")) {

        console.log("\n");
        console.log("##################################################");
        console.log("REALTIME API WRAPPER");
        console.log("##################################################");
        console.log(`URL: ${url}`);
        console.log(`JS LENGTH: ${js.length}`);

        let p = 0;
        let count = 0;

        while (
          (p = js.indexOf("/realtime/api/v1", p)) !== -1
        ) {

          count++;

          console.log("\n");
          console.log(`API OCCURRENCE #${count}`);
          console.log(`POSITION: ${p}`);

          printAround(
            js,
            p,
            2500,
            5000
          );

          p += 5;

          if (count >= 5) {
            break;
          }
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
  console.log("SUMMARY");
  console.log("==================================================");

  console.log(`ALL loadChartData OCCURRENCES: ${totalLoad}`);
  console.log(`REAL loadChartData CALLS: ${realCalls}`);
  console.log(`MODULE 77507 IMPORTER SCRIPTS: ${apiModules}`);

  console.log("\n");
  console.log("==================================================");
  console.log("DIAGNOSTIC FINISHED");
  console.log("==================================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
