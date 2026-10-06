import fs from "fs";

const moodPath =
  "./data/mood_result.json";

const historyPath =
  "./data/mood_history.json";

console.log("====================================");
console.log("Save Mood History");
console.log("====================================");

const moodData =
  JSON.parse(
    fs.readFileSync(
      moodPath,
      "utf8"
    )
  );

let history = {
  stocks: []
};

if (fs.existsSync(historyPath)) {

  try {

    history =
      JSON.parse(
        fs.readFileSync(
          historyPath,
          "utf8"
        )
      );

    if (
      !Array.isArray(
        history.stocks
      )
    ) {
      history.stocks = [];
    }

  } catch (error) {

    console.log(
      "History read error. Starting new history."
    );

    history = {
      stocks: []
    };

  }
}

const today =
  new Date()
    .toISOString()
    .slice(0, 10);

for (
  const stock
  of moodData.stocks
) {

  if (
    stock.mood === null ||
    stock.mood === undefined
  ) {
    continue;
  }

  const existingIndex =
    history.stocks.findIndex(
      row =>
        row.keyword ===
          stock.keyword &&
        row.date === today
    );

  const record = {
    keyword:
      stock.keyword,

    date:
      today,

    mood:
      stock.mood,

    label:
      stock.label,

    negative:
      stock.negative,

    positive:
      stock.positive,

    posts24h:
      stock.posts24h,

    heat:
      stock.heat,

    confidence:
      stock.confidence
  };

  if (existingIndex >= 0) {

    history.stocks[
      existingIndex
    ] = record;

  } else {

    history.stocks.push(
      record
    );

  }

  console.log("");
  console.log(
    stock.keyword
  );

  console.log(
    "date:",
    today
  );

  console.log(
    "mood:",
    stock.mood
  );
}

history.stocks.sort(
  (a, b) => {

    if (
      a.keyword ===
      b.keyword
    ) {
      return a.date.localeCompare(
        b.date
      );
    }

    return a.keyword.localeCompare(
      b.keyword
    );
  }
);

history.updatedAt =
  new Date().toISOString();

fs.writeFileSync(
  historyPath,
  JSON.stringify(
    history,
    null,
    2
  )
);

console.log("");
console.log("====================================");
console.log("HISTORY SAVED");
console.log("====================================");

console.log(
  historyPath
);

console.log(
  "records:",
  history.stocks.length
);
