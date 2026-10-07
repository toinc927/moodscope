import fs from "fs";

const moodChangePath =
  "./data/mood_change.json";

const priceSignalPath =
  "./data/price_signal.json";

const outputPath =
  "./data/signals.json";

console.log("====================================");
console.log("Calculate Investment Signals");
console.log("====================================");

const moodData =
  JSON.parse(
    fs.readFileSync(
      moodChangePath,
      "utf8"
    )
  );

const priceData =
  JSON.parse(
    fs.readFileSync(
      priceSignalPath,
      "utf8"
    )
  );

const moodStocks =
  moodData.stocks || [];

const priceStocks =
  priceData.stocks || [];

const results = [];

for (const mood of moodStocks) {

  const price =
    priceStocks.find(
      row =>
        row.keyword ===
        mood.keyword
    );

  const currentMood =
    mood.currentMood;

  const moodChange =
    mood.change;

  const changePct =
    price?.changePct ?? null;

  const signals = [];

  /*
   * ① 警戒気味なのに株価上昇
   *
   * Moodが-20以下
   * かつ株価が上昇
   */
  if (
    currentMood !== null &&
    currentMood <= -20 &&
    changePct !== null &&
    changePct > 0
  ) {
    signals.push(
      "警戒なのに株価上昇"
    );
  }

  /*
   * ② Mood急落
   *
   * 前日より15ポイント以上悪化
   */
  if (
    moodChange !== null &&
    moodChange <= -15
  ) {
    signals.push(
      "Mood急落"
    );
  }

  /*
   * ③ 悲観急変
   *
   * 現在Moodが-20以下
   * かつ前日より15ポイント以上悪化
   */
  if (
    currentMood !== null &&
    currentMood <= -20 &&
    moodChange !== null &&
    moodChange <= -15
  ) {
    signals.push(
      "悲観急変"
    );
  }

  let priority =
    "通常";

  if (
    signals.includes(
      "悲観急変"
    )
  ) {
    priority =
      "高";
  } else if (
    signals.length > 0
  ) {
    priority =
      "中";
  }

  results.push({
    keyword:
      mood.keyword,

    currentMood,

    moodChange,

    priceChangePct:
      changePct,

    signals,

    priority,

    status:
      mood.status
  });

  console.log("");
  console.log(
    "STOCK:",
    mood.keyword
  );

  console.log(
    "Mood:",
    currentMood
  );

  console.log(
    "Mood Change:",
    moodChange
  );

  console.log(
    "Price Change:",
    changePct
  );

  console.log(
    "Signals:",
    signals.length > 0
      ? signals.join(", ")
      : "なし"
  );

  console.log(
    "Priority:",
    priority
  );
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
console.log("SIGNALS SAVED");
console.log("====================================");

console.log(
  outputPath
);

console.log(
  "stocks:",
  results.length
);
