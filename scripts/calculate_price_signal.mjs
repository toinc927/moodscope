import fs from "fs";

const INPUT_FILE = "./data/yahoo_prices.json";
const OUTPUT_FILE = "./data/price_signal.json";

const prices = JSON.parse(
  fs.readFileSync(INPUT_FILE, "utf8")
);

const grouped = {};

for (const row of prices) {
  if (!grouped[row.keyword]) {
    grouped[row.keyword] = [];
  }

  grouped[row.keyword].push(row);
}

const stocks = [];

for (const [keyword, rows] of Object.entries(grouped)) {
  rows.sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (rows.length === 0) {
    continue;
  }

  const latest = rows[rows.length - 1];

  const previous =
    rows.length >= 2
      ? rows[rows.length - 2]
      : null;

  let changePct = null;
  let direction = "判定不可";

  if (
    previous &&
    typeof previous.close === "number" &&
    previous.close !== 0 &&
    typeof latest.close === "number"
  ) {
    changePct =
      ((latest.close - previous.close) /
        previous.close) *
      100;

    changePct =
      Math.round(changePct * 100) / 100;

    if (changePct > 0) {
      direction = "上昇";
    } else if (changePct < 0) {
      direction = "下落";
    } else {
      direction = "変化なし";
    }
  }

  stocks.push({
    keyword,
    symbol: latest.symbol,
    date: latest.date,
    close: latest.close,
    previousClose: previous
      ? previous.close
      : null,
    changePct,
    direction
  });
}

const result = {
  updatedAt: new Date().toISOString(),
  stocks
};

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(result, null, 2),
  "utf8"
);

console.log(
  JSON.stringify(result, null, 2)
);
