import fs from "fs";

const sentimentPath =
  "./data/yahoo_sentiment.json";

const moodPath =
  "./data/mood_data.json";

const outputPath =
  "./data/mood_result.json";

console.log("====================================");
console.log("Calculate Mood");
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

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function round(
  value
) {
  return Math.round(
    value
  );
}

const results = [];

for (
  const sentiment
  of sentimentData.stocks
) {

  const keyword =
    sentiment.keyword;

  const moodRows =
    moodData.stocks.filter(
      stock =>
        stock.keyword === keyword
    );

  const latestMoodRow =
    moodRows.length > 0
      ? moodRows[moodRows.length - 1]
      : null;

  const negative =
    Number(
      sentiment.negative
    );

  const positive =
    Number(
      sentiment.positive
    );

  if (
    !Number.isFinite(negative) ||
    !Number.isFinite(positive)
  ) {

    console.log(
      "ERROR:",
      keyword,
      "sentiment unavailable"
    );

    results.push({
      keyword,
      mood: null,
      polarity: null,
      confidence: null,
      status: "判定不可"
    });

    continue;
  }

  const polarity =
    positive - negative;

  let confidence = 0.55;

  const posts24h =
    latestMoodRow
      ? Number(
          latestMoodRow.posts24h
        )
      : null;

  const baseline =
    latestMoodRow
      ? Number(
          latestMoodRow.baselinePosts24h
        )
      : null;

  if (
    Number.isFinite(posts24h) &&
    Number.isFinite(baseline) &&
    baseline > 0
  ) {

    const ratio =
      posts24h / baseline;

    confidence =
      0.55 +
      0.45 *
      Math.sqrt(ratio);

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
        polarity *
        confidence
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
  console.log(
    "STOCK:",
    keyword
  );

  console.log(
    "negative:",
    negative
  );

  console.log(
    "positive:",
    positive
  );

  console.log(
    "polarity:",
    polarity
  );

  console.log(
    "confidence:",
    confidence.toFixed(3)
  );

  console.log(
    "mood:",
    mood
  );

  console.log(
    "label:",
    label
  );

  results.push({
    keyword,
    negative,
    positive,
    polarity,
    confidence:
      Number(
        confidence.toFixed(3)
      ),
    mood,
    label,
    posts24h:
      Number.isFinite(posts24h)
        ? posts24h
        : null,
    baselinePosts24h:
      Number.isFinite(baseline)
        ? baseline
        : null,
    heat:
      latestMoodRow?.heat ??
      null,
    date:
      sentiment.date
  });
}

const output = {
  updatedAt:
    new Date().toISOString(),
  stocks:
    results
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

console.log(
  outputPath
);

console.log(
  "stocks:",
  results.length
);
