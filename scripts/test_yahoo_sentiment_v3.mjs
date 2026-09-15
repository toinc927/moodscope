const keyword = "ファナック";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const pageUrl =
  `https://search.yahoo.co.jp/realtime/search?p=${encodeURIComponent(keyword)}`;

const terms = [
  "sentimentData",
  "dataPositive",
  "dataNegative",
  "sentiment",
  "positive",
  "negative",
  "感情の割合",
  "ポジティブ",
  "ネガティブ"
];

function printContexts(text, term, limit = 10) {
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
        Math.max(0, i - 1000),
        Math.min(text.length, i + 2000)
      )
    );

    pos = i + needle.length;
    count++;
  }

  return count;
}

function findApiUrls(text) {
  const results = new Set();

  const patterns = [
    /https?:\/\/[^"'\\\s]+/gi,
    /\/api\/[^"'\\\s]+/gi,
    /\/realtime\/[^"'\\\s]+/gi,
    /\/search[^"'\\\s]+/gi
  ];

  for (const re of patterns) {
    let m;

    while ((m = re.exec(text)) !== null) {
      const value = m[0];

      if (
        value.includes("sentiment") ||
        value.includes("realtime") ||
        value.includes("search") ||
        value.includes("/api/")
      ) {
        results.add(value);
      }

      if (results.size >= 100) break;
    }
  }

  return [...results];
}

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

async function main() {
  console.log("======================================");
  console.log("Yahoo sentiment v3 diagnostic");
  console.log("======================================");

  console.log(`KEYWORD: ${keyword}`);
  console.log(`PAGE: ${pageUrl}`);

  // ------------------------------------
  // 1. Yahoo HTML
  // ------------------------------------

  const page = await fetchText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log(`\nPAGE HTTP: ${page.status}`);
  console.log(`HTML LENGTH: ${page.text.length}`);

  console.log("\n======================================");
  console.log("HTML: sentimentData search");
  console.log("======================================");

  for (const term of [
    "sentimentData",
    "dataPositive",
    "dataNegative",
    "__next_f",
    "__NEXT_DATA__"
  ]) {
    const count = printContexts(page.text, term, 5);
    console.log(`\n${term} COUNT: ${count}`);
  }

  console.log("\n======================================");
  console.log("HTML: possible API URLs");
  console.log("======================================");

  const htmlUrls = findApiUrls(page.text);

  for (const url of htmlUrls.slice(0, 100)) {
    console.log(url);
  }

  // ------------------------------------
  // 2. External JavaScript
  // ------------------------------------

  const scriptUrls = [
    ...page.text.matchAll(
      /<script[^>]+src=["']([^"']+)["']/gi
    )
  ].map(m => m[1]);

  const uniqueScripts = [
    ...new Set(
      scriptUrls.map(src =>
        src.startsWith("http")
          ? src
          : new URL(src, pageUrl).href
      )
    )
  ];

  console.log("\n======================================");
  console.log("EXTERNAL SCRIPT COUNT");
  console.log("======================================");

  console.log(uniqueScripts.length);

  // ------------------------------------
  // 3. Inline scripts
  // ------------------------------------

  const inlineScripts = [
    ...page.text.matchAll(
      /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi
    )
  ].map(m => m[1]);

  console.log("\n======================================");
  console.log("INLINE SCRIPT COUNT");
  console.log("======================================");

  console.log(inlineScripts.length);

  for (let i = 0; i < inlineScripts.length; i++) {
    const js = inlineScripts[i];

    if (
      js.includes("sentimentData") ||
      js.includes("dataPositive") ||
      js.includes("dataNegative")
    ) {
      console.log(
        `\n######## INLINE SCRIPT HIT ${i} ########`
      );

      console.log(`JS LENGTH: ${js.length}`);

      for (const term of [
        "sentimentData",
        "dataPositive",
        "dataNegative"
      ]) {
        printContexts(js, term, 10);
      }

      console.log("\nPOSSIBLE URLS:");

      for (const url of findApiUrls(js)) {
        console.log(url);
      }
    }
  }

  // ------------------------------------
  // 4. External scripts
  // ------------------------------------

  let hitCount = 0;

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

      const foundTerms = terms.filter(term =>
        js.toLowerCase().includes(term.toLowerCase())
      );

      const importantTerms = [
        "sentimentData",
        "dataPositive",
        "dataNegative"
      ];

      const importantHit = importantTerms.some(term =>
        js.toLowerCase().includes(term.toLowerCase())
      );

      if (!importantHit) {
        continue;
      }

      hitCount++;

      console.log("\n\n######################################");
      console.log("######## IMPORTANT SCRIPT HIT ########");
      console.log("######################################");

      console.log(`URL: ${url}`);
      console.log(`JS LENGTH: ${js.length}`);
      console.log(`TERMS: ${foundTerms.join(", ")}`);

      console.log("\n--- POSSIBLE API / DATA URLS ---");

      for (const apiUrl of findApiUrls(js)) {
        console.log(apiUrl);
      }

      console.log("\n--- sentimentData ---");

      printContexts(js, "sentimentData", 20);

      console.log("\n--- dataPositive ---");

      printContexts(js, "dataPositive", 10);

      console.log("\n--- dataNegative ---");

      printContexts(js, "dataNegative", 10);

      console.log("\n--- fetch( / axios / useSWR references ---");

      const fetchPatterns = [
        /fetch\([^)]{0,1000}\)/gi,
        /axios\.[a-z]+\([^)]{0,1000}\)/gi,
        /useSWR\([^)]{0,1000}\)/gi
      ];

      for (const re of fetchPatterns) {
        let m;
        let count = 0;

        while ((m = re.exec(js)) !== null && count < 20) {
          console.log(`\n${m[0]}`);
          count++;
        }
      }
    } catch (e) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${e.message}`
      );
    }
  }

  console.log("\n======================================");
  console.log("SUMMARY");
  console.log("======================================");

  console.log(`IMPORTANT SCRIPT HITS: ${hitCount}`);

  console.log("\nYahoo sentiment v3 diagnostic finished.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
