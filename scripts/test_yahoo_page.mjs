const keywords = [
  "ファナック",
  "安川電機",
  "ハーモニック・ドライブ",
  "IHI"
];

function findInteresting(text) {
  const terms = [
    "感情", "ポジティブ", "ネガティブ",
    "positive", "negative", "sentiment",
    "emotion", "sentimentRatio"
  ];

  const hits = [];

  for (const term of terms) {
    let pos = 0;

    while (true) {
      const i = text.toLowerCase().indexOf(term.toLowerCase(), pos);
      if (i < 0) break;

      hits.push({
        term,
        position: i,
        context: text.slice(
          Math.max(0, i - 500),
          Math.min(text.length, i + 1000)
        )
      });

      pos = i + term.length;

      if (hits.length >= 30) return hits;
    }
  }

  return hits;
}

async function probe(keyword) {
  const url =
    `https://search.yahoo.co.jp/realtime/search?p=${encodeURIComponent(keyword)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Referer": "https://search.yahoo.co.jp/realtime/search"
    }
  });

  const html = await res.text();

  console.log(`\n===== ${keyword} =====`);
  console.log(`HTTP: ${res.status}`);
  console.log(`HTML length: ${html.length}`);

  const hits = findInteresting(html);

  console.log(`interesting hits: ${hits.length}`);

  for (const hit of hits.slice(0, 10)) {
    console.log(`\n--- ${hit.term} @ ${hit.position} ---`);
    console.log(hit.context);
  }

  const nextData = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );

  if (nextData) {
    console.log("\nFOUND __NEXT_DATA__");
    console.log(nextData[1].slice(0, 12000));
  } else {
    console.log("\n__NEXT_DATA__ not found");
  }

  const scripts = [...html.matchAll(
    /<script[^>]+src=["']([^"']+)["']/gi
  )].map(m => m[1]);

  console.log(`\nscript src count: ${scripts.length}`);
  console.log(scripts.slice(0, 30).join("\n"));
}

for (const keyword of keywords) {
  try {
    await probe(keyword);
  } catch (e) {
    console.error(`${keyword}: ${e.message}`);
  }
}
