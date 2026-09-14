const keywords = [
  "ファナック",
  "安川電機",
  "ハーモニック・ドライブ",
  "IHI"
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const terms = [
  "感情の割合",
  "ポジティブ",
  "ネガティブ",
  "sentiment",
  "sentiments",
  "sentimentRatio",
  "emotion",
  "positive",
  "negative"
];

function contexts(text, term, limit = 8) {
  const out = [];
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();

  let pos = 0;

  while (out.length < limit) {
    const i = lower.indexOf(needle, pos);

    if (i < 0) break;

    out.push({
      position: i,
      context: text.slice(
        Math.max(0, i - 350),
        Math.min(text.length, i + 700)
      )
    });

    pos = i + needle.length;
  }

  return out;
}

function ratioMatches(text) {
  const patterns = [
    /"positive"\s*:\s*(\d+(?:\.\d+)?)/gi,
    /"negative"\s*:\s*(\d+(?:\.\d+)?)/gi,
    /"neutral"\s*:\s*(\d+(?:\.\d+)?)/gi,
    /"pos(?:itive)?Ratio"\s*:\s*(\d+(?:\.\d+)?)/gi,
    /"neg(?:ative)?Ratio"\s*:\s*(\d+(?:\.\d+)?)/gi,

    /ポジティブ.{0,100}?(\d{1,3})\s*%/g,
    /ネガティブ.{0,100}?(\d{1,3})\s*%/g,

    /positive.{0,100}?(\d{1,3})\s*%/gi,
    /negative.{0,100}?(\d{1,3})\s*%/gi
  ];

  const matches = [];

  for (const re of patterns) {
    let m;

    while ((m = re.exec(text)) !== null && matches.length < 50) {
      matches.push({
        match: m[0],
        position: m.index,
        context: text.slice(
          Math.max(0, m.index - 500),
          Math.min(text.length, m.index + 1000)
        )
      });
    }
  }

  return matches;
}

async function getText(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "*/*",
      ...headers
    }
  });

  const text = await res.text();

  return {
    res,
    text
  };
}

async function probe(keyword) {
  const pageUrl =
    `https://search.yahoo.co.jp/realtime/search?p=${encodeURIComponent(keyword)}`;

  const {
    res,
    text: html
  } = await getText(pageUrl, {
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer":
      "https://search.yahoo.co.jp/realtime/search"
  });

  console.log(`\n\n================ ${keyword} ================`);

  console.log(`PAGE HTTP: ${res.status}`);
  console.log(`HTML length: ${html.length}`);

  // --------------------------------------------------
  // ① HTMLそのものに感情割合が入っていないか
  // --------------------------------------------------

  const ratios = ratioMatches(html);

  console.log(`\nRATIO-LIKE MATCHES: ${ratios.length}`);

  for (const x of ratios.slice(0, 15)) {
    console.log(`\n--- ${x.match} @ ${x.position} ---`);
    console.log(x.context);
  }

  // --------------------------------------------------
  // ② 感情関連キーワードの出現数
  // --------------------------------------------------

  console.log("\nDIRECT TERM COUNTS:");

  for (const term of terms) {
    console.log(
      `${term}: ${contexts(html, term, 20).length}`
    );
  }

  // --------------------------------------------------
  // ③ ページが読み込んでいるJavaScriptを取得
  // --------------------------------------------------

  const scriptUrls = [
    ...html.matchAll(
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

  console.log(
    `\nSCRIPT COUNT: ${uniqueScripts.length}`
  );

  // --------------------------------------------------
  // ④ JavaScriptの中も調査
  // --------------------------------------------------

  for (const url of uniqueScripts.slice(0, 40)) {
    try {
      const {
        res: jsRes,
        text: js
      } = await getText(url, {
        "Accept":
          "application/javascript,text/javascript,*/*;q=0.1",
        "Referer": pageUrl
      });

      if (!jsRes.ok) continue;

      const found = terms.filter(term =>
        js.toLowerCase().includes(term.toLowerCase())
      );

      const jsRatios = ratioMatches(js);

      if (found.length || jsRatios.length) {
        console.log(
          `\n######## SCRIPT HIT ########`
        );

        console.log(`URL: ${url}`);
        console.log(`JS length: ${js.length}`);

        console.log(
          `TERMS: ${found.join(", ")}`
        );

        console.log(
          `RATIO MATCHES: ${jsRatios.length}`
        );

        // 数値らしき割合
        for (const x of jsRatios.slice(0, 10)) {
          console.log(
            `\n--- ${x.match} @ ${x.position} ---`
          );

          console.log(x.context);
        }

        // キーワード周辺
        for (const term of found) {
          for (const c of contexts(js, term, 3)) {
            console.log(
              `\n--- ${term} @ ${c.position} ---`
            );

            console.log(c.context);
          }
        }
      }
    } catch (e) {
      console.log(
        `SCRIPT ERROR: ${url} :: ${e.message}`
      );
    }
  }
}

// --------------------------------------------------
// 4銘柄を順番に調査
// --------------------------------------------------

for (const keyword of keywords) {
  try {
    await probe(keyword);
  } catch (e) {
    console.error(
      `${keyword}: ${e.message}`
    );
  }
}
