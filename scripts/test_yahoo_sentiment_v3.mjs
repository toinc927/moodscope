const keyword = "ファナック";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const pageUrl =
  `https://search.yahoo.co.jp/realtime/search?p=${encodeURIComponent(keyword)}`;

const importantTerms = [
  "sentimentData",
  "dataPositive",
  "dataNegative"
];

const secondaryTerms = [
  "positive",
  "negative",
  "sentiment",
  "感情の割合",
  "ポジティブ",
  "ネガティブ"
];

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

function countOccurrences(text, term) {
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();

  let count = 0;
  let pos = 0;

  while (true) {
    const i = lower.indexOf(needle, pos);

    if (i < 0) break;

    count++;
    pos = i + needle.length;
  }

  return count;
}

function printContext(text, term, limit = 8) {
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();

  let pos = 0;
  let count = 0;

  while (count < limit) {
    const i = lower.indexOf(needle, pos);

    if (i < 0) break;

    console.log(`\n--- ${term} @ ${i} ---`);

    console.log(
      text.slice(
        Math.max(0, i - 1200),
        Math.min(text.length, i + 2500)
      )
    );

    pos = i + needle.length;
    count++;
  }

  return count;
}

function findUrls(text) {
  const results = new Set();

  const patterns = [
    /https?:\/\/[^"'\\\s<>()]+/gi,
    /\/api\/[^"'\\\s<>()]+/gi,
    /\/realtime\/[^"'\\\s<>()]+/gi,
    /\/search\/[^"'\\\s<>()]+/gi
  ];

  for (const re of patterns) {
    let match;

    while ((match = re.exec(text)) !== null) {
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
        results.add(value);
      }

      if (results.size >= 100) {
        break;
      }
    }
  }

  return [...results];
}

function printAssignmentPatterns(text) {
  const patterns = [
    /sentimentData\s*=/gi,
    /sentimentData\s*:/gi,
    /["']sentimentData["']\s*:/gi,
    /dataPositive\s*:/gi,
    /dataNegative\s*:/gi,
    /positive\s*:/gi,
    /negative\s*:/gi,
    /sentimentData\s*\(/gi,
    /\.\s*sentimentData/gi
  ];

  for (const re of patterns) {
    let match;
    let count = 0;

    while (
      (match = re.exec(text)) !== null &&
      count < 15
    ) {
      console.log(
        `\nPATTERN: ${re}`
      );

      console.log(
        `POSITION: ${match.index}`
      );

      console.log(
        text.slice(
          Math.max(0, match.index - 1800),
          Math.min(text.length, match.index + 3500)
        )
      );

      count++;
    }
  }
}

function printDataGetterPatterns(text) {
  const patterns = [
    /fetch\s*\(/gi,
    /axios/gi,
    /XMLHttpRequest/gi,
    /useSWR/gi,
    /useQuery/gi,
    /queryFn/gi,
    /get[A-Z][A-Za-z0-9_]*/g,
    /request[A-Z][A-Za-z0-9_]*/g,
    /client\.[a-zA-Z]+\(/g
  ];

  for (const re of patterns) {
    let match;
    let count = 0;

    while (
      (match = re.exec(text)) !== null &&
      count < 10
    ) {
      console.log(
        `\nGETTER PATTERN: ${re}`
      );

      console.log(
        text.slice(
          Math.max(0, match.index - 1000),
          Math.min(text.length, match.index + 2200)
        )
      );

      count++;
    }
  }
}

async function main() {
  console.log("========================================");
  console.log("Yahoo sentiment v4 diagnostic");
  console.log("========================================");

  console.log(`KEYWORD: ${keyword}`);
  console.log(`PAGE: ${pageUrl}`);

  // ======================================
  // 1. Fetch Yahoo page
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
  // 2. Search HTML
  // ======================================

  console.log("\n========================================");
  console.log("HTML IMPORTANT TERMS");
  console.log("========================================");

  for (const term of importantTerms) {
    console.log(
      `${term}: ${countOccurrences(page.text, term)}`
    );
  }

  console.log("\n========================================");
  console.log("HTML NEXT DATA TERMS");
  console.log("========================================");

  for (const term of [
    "__next_f",
    "__NEXT_DATA__",
    "pageProps",
    "initialState",
    "dehydratedState"
  ]) {
    console.log(
      `${term}: ${countOccurrences(page.text, term)}`
    );
  }

  console.log("\n========================================");
  console.log("HTML SENTIMENT CONTEXT");
  console.log("========================================");

  for (const term of importantTerms) {
    printContext(page.text, term, 5);
  }

  // ======================================
  // 3. Inline scripts
  // ======================================

  const inlineScripts = [
    ...page.text.matchAll(
      /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi
    )
  ].map(match => match[1]);

  console.log("\n========================================");
  console.log("INLINE SCRIPT COUNT");
  console.log("========================================");

  console.log(inlineScripts.length);

  for (let i = 0; i < inlineScripts.length; i++) {
    const js = inlineScripts[i];

    const importantHit =
      importantTerms.some(term =>
        js.toLowerCase().includes(term.toLowerCase())
      );

    if (!importantHit) {
      continue;
    }

    console.log(
      `\n########################################`
    );

    console.log(
      `INLINE SCRIPT HIT: ${i}`
    );

    console.log(
      `JS LENGTH: ${js.length}`
    );

    console.log(
      `########################################`
    );

    printAssignmentPatterns(js);

    console.log("\nPOSSIBLE URLS:");

    for (const url of findUrls(js)) {
      console.log(url);
    }
  }

  // ======================================
  // 4. Find external JS
  // ======================================

  const scriptUrls = [
    ...page.text.matchAll(
      /<script[^>]+src=["']([^"']+)["']/gi
    )
  ].map(match => match[1]);

  const uniqueScripts = [
    ...new Set(
      scriptUrls.map(src =>
        src.startsWith("http")
          ? src
          : new URL(src, pageUrl).href
      )
    )
  ];

  console.log("\n========================================");
  console.log("EXTERNAL SCRIPT COUNT");
  console.log("========================================");

  console.log(uniqueScripts.length);

  // ======================================
  // 5. Fetch every external JS
  // ======================================

  let importantHitCount = 0;

  for (const url of uniqueScripts) {
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

      const hits = importantTerms.filter(term =>
        js.toLowerCase().includes(term.toLowerCase())
      );

      if (hits.length === 0) {
        continue;
      }

      importantHitCount++;

      console.log(
        "\n\n########################################"
      );

      console.log(
        "######## IMPORTANT SCRIPT HIT ########"
      );

      console.log(
        "########################################"
      );

      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);
      console.log(`IMPORTANT TERMS: ${hits.join(", ")}`);

      // ------------------------------------
      // Exact occurrence counts
      // ------------------------------------

      console.log("\n--- OCCURRENCE COUNTS ---");

      for (const term of [
        ...importantTerms,
        ...secondaryTerms
      ]) {
        const count = countOccurrences(
          js,
          term
        );

        if (count > 0) {
          console.log(
            `${term}: ${count}`
          );
        }
      }

      // ------------------------------------
      // Assignment patterns
      // ------------------------------------

      console.log(
        "\n--- ASSIGNMENT / OBJECT PATTERNS ---"
      );

      printAssignmentPatterns(js);

      // ------------------------------------
      // Possible API URLs
      // ------------------------------------

      console.log(
        "\n--- POSSIBLE API / DATA URLS ---"
      );

      const urls = findUrls(js);

      if (urls.length === 0) {
        console.log("(none)");
      }

      for (const apiUrl of urls) {
        console.log(apiUrl);
      }

      // ------------------------------------
      // Data getter patterns
      // ------------------------------------

      console.log(
        "\n--- DATA GETTER PATTERNS ---"
      );

      printDataGetterPatterns(js);
    } catch (e) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${e.message}`
      );
    }
  }

  // ======================================
  // 6. Summary
  // ======================================

  console.log("\n========================================");
  console.log("SUMMARY");
  console.log("========================================");

  console.log(
    `IMPORTANT SCRIPT HITS: ${importantHitCount}`
  );

  console.log(
    "\nYahoo sentiment v4 diagnostic finished."
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
