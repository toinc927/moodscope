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

function printExactMatches(text, term, limit = 30) {
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();

  let pos = 0;
  let count = 0;

  while (count < limit) {
    const i = lower.indexOf(needle, pos);

    if (i < 0) break;

    console.log("\n");
    console.log("########################################");
    console.log(`EXACT HIT: ${term}`);
    console.log(`POSITION: ${i}`);
    console.log("########################################");

    console.log(
      text.slice(
        Math.max(0, i - 500),
        Math.min(text.length, i + 1500)
      )
    );

    pos = i + needle.length;
    count++;
  }

  return count;
}

function printRegexMatches(text, regex, label, limit = 30) {
  let match;
  let count = 0;

  while (
    (match = regex.exec(text)) !== null &&
    count < limit
  ) {
    console.log("\n");
    console.log("========================================");
    console.log(`REGEX HIT: ${label}`);
    console.log(`POSITION: ${match.index}`);
    console.log(`MATCH: ${match[0]}`);
    console.log("========================================");

    console.log(
      text.slice(
        Math.max(0, match.index - 800),
        Math.min(text.length, match.index + 2200)
      )
    );

    count++;
  }

  return count;
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

async function main() {
  console.log("========================================");
  console.log("Yahoo sentimentData source diagnostic");
  console.log("========================================");

  console.log(`KEYWORD: ${keyword}`);
  console.log(`PAGE: ${pageUrl}`);

  // ======================================
  // 1. Yahoo page
  // ======================================

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log(`\nPAGE HTTP: ${page.status}`);
  console.log(`HTML LENGTH: ${page.text.length}`);

  // ======================================
  // 2. Search HTML itself
  // ======================================

  console.log("\n========================================");
  console.log("HTML: sentimentData");
  console.log("========================================");

  const htmlCount =
    printExactMatches(
      page.text,
      "sentimentData",
      20
    );

  console.log(
    `\nHTML sentimentData occurrences: ${htmlCount}`
  );

  // ======================================
  // 3. Next.js embedded data
  // ======================================

  console.log("\n========================================");
  console.log("HTML: NEXT DATA");
  console.log("========================================");

  for (const term of [
    "__next_f",
    "__NEXT_DATA__",
    "pageProps",
    "initialState",
    "dehydratedState"
  ]) {
    console.log(
      `${term}: ${
        page.text.toLowerCase().split(
          term.toLowerCase()
        ).length - 1
      }`
    );
  }

  // ======================================
  // 4. Inline scripts
  // ======================================

  const inlineScripts = [
    ...page.text.matchAll(
      /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi
    )
  ].map(m => m[1]);

  console.log("\n========================================");
  console.log("INLINE SCRIPTS");
  console.log("========================================");

  console.log(
    `INLINE SCRIPT COUNT: ${inlineScripts.length}`
  );

  for (let i = 0; i < inlineScripts.length; i++) {
    const js = inlineScripts[i];

    if (
      !js.toLowerCase().includes("sentimentdata")
    ) {
      continue;
    }

    console.log("\n");
    console.log("########################################");
    console.log(`INLINE SCRIPT HIT: ${i}`);
    console.log(`JS LENGTH: ${js.length}`);
    console.log("########################################");

    printExactMatches(
      js,
      "sentimentData",
      20
    );
  }

  // ======================================
  // 5. External JS
  // ======================================

  const scripts =
    findScriptUrls(page.text);

  console.log("\n========================================");
  console.log("EXTERNAL SCRIPTS");
  console.log("========================================");

  console.log(
    `SCRIPT COUNT: ${scripts.length}`
  );

  let hitScripts = 0;

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

      if (
        !js.toLowerCase().includes(
          "sentimentdata"
        )
      ) {
        continue;
      }

      hitScripts++;

      console.log("\n\n");
      console.log("########################################");
      console.log("######## SENTIMENT SCRIPT ########");
      console.log("########################################");

      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);

      // ------------------------------------
      // Exact sentimentData occurrences
      // ------------------------------------

      printExactMatches(
        js,
        "sentimentData",
        20
      );

      // ------------------------------------
      // Assignment-like patterns
      // ------------------------------------

      console.log("\n");
      console.log("========================================");
      console.log("ASSIGNMENT-LIKE PATTERNS");
      console.log("========================================");

      printRegexMatches(
        js,
        /sentimentData\s*=/gi,
        "sentimentData =",
        20
      );

      printRegexMatches(
        js,
        /sentimentData\s*:/gi,
        "sentimentData:",
        20
      );

      printRegexMatches(
        js,
        /["']sentimentData["']\s*:/gi,
        "\"sentimentData\":",
        20
      );

      // ------------------------------------
      // Positive / Negative data
      // ------------------------------------

      console.log("\n");
      console.log("========================================");
      console.log("DATA POSITIVE / NEGATIVE");
      console.log("========================================");

      printRegexMatches(
        js,
        /dataPositive\s*:/gi,
        "dataPositive:",
        20
      );

      printRegexMatches(
        js,
        /dataNegative\s*:/gi,
        "dataNegative:",
        20
      );

      // ------------------------------------
      // API-looking strings
      // ------------------------------------

      console.log("\n");
      console.log("========================================");
      console.log("API / DATA LOOKING STRINGS");
      console.log("========================================");

      const patterns = [
        /https?:\/\/[^"'\\\s<>()]+/gi,
        /\/api\/[^"'\\\s<>()]+/gi,
        /\/realtime\/[^"'\\\s<>()]+/gi,
        /\/search\/[^"'\\\s<>()]+/gi
      ];

      const foundUrls = new Set();

      for (const regex of patterns) {
        let match;

        while ((match = regex.exec(js)) !== null) {
          let value = match[0];

          value = value.replace(
            /[),.;}\]]+$/,
            ""
          );

          if (
            value.includes("sentiment") ||
            value.includes("realtime") ||
            value.includes("/api/") ||
            value.includes("/search/")
          ) {
            foundUrls.add(value);
          }

          if (foundUrls.size >= 100) {
            break;
          }
        }
      }

      if (foundUrls.size === 0) {
        console.log("(none)");
      } else {
        for (const value of foundUrls) {
          console.log(value);
        }
      }
    } catch (error) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${error.message}`
      );
    }
  }

  // ======================================
  // 6. Summary
  // ======================================

  console.log("\n");
  console.log("========================================");
  console.log("SUMMARY");
  console.log("========================================");

  console.log(
    `SENTIMENT SCRIPT HITS: ${hitScripts}`
  );

  console.log(
    "Yahoo sentimentData source diagnostic finished."
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
