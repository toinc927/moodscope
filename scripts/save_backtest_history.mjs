import fs from "fs";

const MOOD_FILE = "./data/mood_result.json";
const PRICE_FILE = "./data/price_signal.json";
const SIGNAL_FILE = "./data/signals.json";
const HISTORY_FILE = "./data/backtest_history.json";

function readJson(path, fallback) {
  if (!fs.existsSync(path)) {
    return fallback;
  }

  return JSON.parse(
    fs.readFileSync(path, "utf8")
  );
}

const moodData =
  readJson(MOOD_FILE, { stocks: [] });

const priceData =
  readJson(PRICE_FILE, { stocks: [] });

const signalData =
  readJson(SIGNAL_FILE, { stocks: [] });

const oldHistory =
  readJson(HISTORY_FILE, { records: [] });

const history =
  Array.isArray(oldHistory.records)
    ? oldHistory.records
    : [];

const moodMap = new Map(
  (moodData.stocks || []).map(
    stock => [stock.keyword, stock]
  )
);

const priceMap = new Map(
  (priceData.stocks || []).map(
    stock => [stock.keyword, stock]
  )
);

const signalMap = new Map(
  (signalData.stocks || []).map(
    stock => [stock.keyword, stock]
  )
);

const keywords = new Set([
  ...moodMap.keys(),
  ...priceMap.keys(),
  ...signalMap.keys()
]);

const date =
  moodData.stocks?.[0]?.date ||
  priceData.stocks?.[0]?.date ||
  new Date().toISOString().slice(0, 10);

for (const keyword of keywords) {

  const mood =
    moodMap.get(keyword) || {};

  const price =
    priceMap.get(keyword) || {};

  const signal =
    signalMap.get(keyword) || {};

  const record = {
    date,
    keyword,

    close:
      price.close ?? null,

    mood:
      mood.mood ?? null,

    label:
      mood.label ?? null,

    moodChange:
      signal.moodChange ?? null,

    priceChangePct:
      signal.priceChangePct ??
      price.changePct ??
      null,

    signals:
      Array.isArray(signal.signals)
        ? signal.signals
        : [],

    priority:
      signal.priority ?? "通常",

    posts24h:
      mood.posts24h ?? null,

    heat:
      mood.heat ?? null,

    negative:
      mood.negative ?? null,

    positive:
      mood.positive ?? null,

    nextClose: null,

    nextReturnPct: null
  };

  const index =
    history.findIndex(
      item =>
        item.date === date &&
        item.keyword === keyword
    );

  if (index >= 0) {
    history[index] = record;
  } else {
    history.push(record);
  }
}

history.sort(
  (a, b) =>
    a.date.localeCompare(b.date) ||
    a.keyword.localeCompare(b.keyword)
);

const byKeyword = new Map();

for (const record of history) {

  if (!byKeyword.has(record.keyword)) {
    byKeyword.set(
      record.keyword,
      []
    );
  }

  byKeyword
    .get(record.keyword)
    .push(record);
}

for (const records of byKeyword.values()) {

  for (let i = 0; i < records.length - 1; i++) {

    const current = records[i];
    const next = records[i + 1];

    if (
      current.close !== null &&
      next.close !== null &&
      Number(current.close) !== 0
    ) {

      current.nextClose =
        next.close;

      current.nextReturnPct =
        Number(
          (
            (next.close - current.close) /
            current.close *
            100
          ).toFixed(2)
        );

    }
  }
}

const output = {
  updatedAt:
    new Date().toISOString(),

  records: history
};

fs.writeFileSync(
  HISTORY_FILE,
  JSON.stringify(
    output,
    null,
    2
  )
);

console.log(
  "BACKTEST HISTORY SAVED"
);

console.log(
  HISTORY_FILE
);

console.log(
  "records:",
  history.length
);
