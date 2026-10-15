import fs from "fs";

const sentimentPath =
  "./data/yahoo_sentiment.json";

const moodPath =
  "./data/mood_data.json";

const outputPath =
  "./data/mood_result.json";

console.log("====================================");
console.log("Calculate Mood v1.1");
console.log("====================================");

const sentimentData =
  JSON.parse(
    fs.readFileSync(
      sentimentPath,
      "utf8"
    )
  );

const moodData =
  JSON.parse(
    fs.readFileSync(
      moodPath,
      "utf8"
    )
  );

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function round(value) {
  return Math.round(value);
}

function isValidPercentage(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

const results = [];

for (const sentiment of sentimentData.stocks || []) {
  const keyword = sentiment.keyword;

  const moodRows =
    (moodData.stocks || []).filter(
      stock =>
        stock.keyword === keyword
    );

  const latestMoodRow =
    moodRows.length > 0
      ? moodRows[moodRows.length - 1]
      : null;

  const negative = sentiment.negative;
  const positive = sentiment.positive;

  const validSentiment =
    isValidPercentage(negative) &&
    isValidPercentage(positive) &&
    negative + positive > 0;

  const posts24h =
    latestMoodRow &&
    Number.isFinite(
      Number(latestMoodRow.posts24h)
    )
      ? Number(latestMoodRow.posts24h)
      : null;

  const baseline =
    latestMoodRow &&
    latestMoodRow.baselinePosts24h !== null &&
    latestMoodRow.baselinePosts24h !== undefined &&
    Number.isFinite(
      Number(latestMoodRow.baselinePosts24h)
    )
      ? Number(latestMoodRow.baselinePosts24h)
      : null;

  if (!validSentiment) {
    console.log("");
    console.log("DATA UNAVAILABLE:", keyword);
    console.log("negative:", negative);
    console.log("positive:", positive);

    results.push({
      keyword,
      negative:
        Number.isFinite(negative)
          ? negative
          : null,
      positive:
        Number.isFinite(positive)
          ? positive
          : null,
      polarity: null,
      confidence: null,
      mood: null,
      label: "データ不足",
      posts24h,
      baselinePosts24h: baseline,
      heat: latestMoodRow?.heat ?? null,
      date: sentiment.date ?? null,
      status: "判定不可",
      reason:
        "センチメントが未取得、または有効なデータがありません"
    });

    continue;
  }

  const polarity =
    positive - negative;

  let confidence = 0.55;

  if (
    posts24h !== null &&
    baseline !== null &&
    baseline > 0
  ) {
    const ratio =
      posts24h / baseline;

    confidence =
      0.55 +
      0.45 * Math.sqrt(ratio);

    confidence =
      clamp(
        confidence,
        0.55,
        1
      );
  }

  const mood =
    clamp(
      round(
        polarity * confidence
      ),
      -100,
      100
    );

  let label = "中立";

  if (mood <= -60) {
    label = "総悲観";
  } else if (mood <= -20) {
    label = "警戒";
  } else if (mood >= 60) {
    label = "浮かれてる";
  } else if (mood >= 20) {
    label = "楽観";
  }

  console.log("");
  console.log("STOCK:", keyword);
  console.log("negative:", negative);
  console.log("positive:", positive);
  console.log("polarity:", polarity);
  console.log("confidence:", confidence.toFixed(3));
  console.log("mood:", mood);
  console.log("label:", label);

  results.push({
    keyword,
    negative,
    positive,
    polarity,
    confidence:
      Number(confidence.toFixed(3)),
    mood,
    label,
    posts24h,
    baselinePosts24h: baseline,
    heat: latestMoodRow?.heat ?? null,
    date: sentiment.date ?? null,
    status: "計算済み",
    reason: null
  });
}

const output = {
  updatedAt:
    new Date().toISOString(),
  methodVersion: "v1.1",
  stocks: results
};

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    output,
    null,
    2
  )
);

console.log("");
console.log("====================================");
console.log("MOOD SAVED");
console.log("====================================");

console.log(outputPath);
console.log("stocks:", results.length);

console.log(
  "判定不可:",
  results.filter(
    stock => stock.status === "判定不可"
  ).length
);

console.log(
  "計算済み:",
  results.filter(
    stock => stock.status === "計算済み"
  ).length
);
