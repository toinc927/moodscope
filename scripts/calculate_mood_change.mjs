import fs from "fs";

const historyPath =
  "./data/mood_history.json";

const outputPath =
  "./data/mood_change.json";

console.log("====================================");
console.log("Calculate Mood Change");
console.log("====================================");

const history =
  JSON.parse(
    fs.readFileSync(
      historyPath,
      "utf8"
    )
  );

const stocks =
  history.stocks || [];

const keywords = [
  "ファナック",
  "ソフトバンクグループ",
  "メタプラネット",
  "データセクション"
];

const results = [];

for (const keyword of keywords) {

  const rows =
    stocks
      .filter(
        row =>
          row.keyword === keyword
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(
            b.date
          )
      );

  console.log("");
  console.log(
    "STOCK:",
    keyword
  );

  if (rows.length < 2) {

    console.log(
      "Not enough history."
    );

    results.push({
      keyword,
      currentMood:
        rows.length === 1
          ? rows[0].mood
          : null,
      previousMood: null,
      change: null,
      status: "蓄積中"
    });

    continue;
  }

  const current =
    rows[rows.length - 1];

  const previous =
    rows[rows.length - 2];

  const change =
    Number(current.mood) -
    Number(previous.mood);

  console.log(
    "current:",
    current.mood
  );

  console.log(
    "previous:",
    previous.mood
  );

  console.log(
    "change:",
    change
  );

  results.push({
    keyword,

    currentDate:
      current.date,

    currentMood:
      current.mood,

    previousDate:
      previous.date,

    previousMood:
      previous.mood,

    change,

    status:
      "計算済み"
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
console.log("MOOD CHANGE SAVED");
console.log("====================================");

console.log(
  outputPath
);

console.log(
  "stocks:",
  results.length
);
