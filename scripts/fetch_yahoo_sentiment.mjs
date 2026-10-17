import { chromium } from "playwright";
import fs from "fs";

const configPath = "./config/stocks.json";
const outputPath = "./data/yahoo_sentiment.json";
const debugPath = "./data/yahoo_sentiment_debug.json";

const stocks = JSON.parse(
  fs.readFileSync(configPath, "utf8")
);

console.log("====================================");
console.log("Yahoo 24-hour sentiment fetch");
console.log("DEBUG VERSION 2");
console.log("====================================");
console.log("stocks:", stocks.length);

const browser = await chromium.launch({
  headless: true
});

const results = [];
const debugResults = [];

for (const stock of stocks) {
  const keyword = stock.keyword;

  console.log("");
  console.log("====================================");
  console.log("STOCK:", keyword);
  console.log("====================================");

  const page = await browser.newPage();

  let latestSentiment = null;
  const stockDebug = [];

  page.on("response", async (response) => {
    const url = response.url();

    if (!url.includes("/realtime/api/v1/transition")) {
      return;
    }

    try {
      const parsed = new URL(url);
      const data = await response.json();

      const parameters = Object.fromEntries(
        parsed.searchParams.entries()
      );

      const sentiment = data?.sentimentPieChart;

      const record = {
        keyword,
        capturedAt: new Date().toISOString(),
        httpStatus: response.status(),
        parameters,
        responseKeys: Object.keys(data || {}),
        sentimentPieChart: sentiment ?? null,
        fullResponse: data
      };

      stockDebug.push(record);

      console.log("");
      console.log("TRANSITION API");
      console.log("keyword:", keyword);
      console.log("span:", parameters.span);
      console.log("samplingRate:", parameters.samplingRate);
      console.log("HTTP status:", response.status());
      console.log(
        "response keys:",
        JSON.stringify(record.responseKeys)
      );
      console.log(
        "sentimentPieChart:",
        JSON.stringify(record.sentimentPieChart)
      );

      if (
        parameters.span === "86400" &&
        parameters.samplingRate === "100"
      ) {
        console.log("24-HOUR RESPONSE DETECTED");

        latestSentiment = {
          negative: sentiment?.negative ?? null,
          positive: sentiment?.positive ?? null
        };

        console.log(
          "24-hour negative:",
          latestSentiment.negative
        );
        console.log(
          "24-hour positive:",
          latestSentiment.positive
        );

        console.log(
          "24-hour full response:",
          JSON.stringify(data).slice(0, 12000)
        );
      }
    } catch (error) {
      console.log(
        "Response parse error:",
        error.message
      );

      stockDebug.push({
        keyword,
        capturedAt: new Date().toISOString(),
        error: error.message
      });
    }
  });

  const yahooUrl =
    "https://search.yahoo.co.jp/realtime/search?p=" +
    encodeURIComponent(keyword);

  console.log("Opening Yahoo...");

  await page.goto(yahooUrl, {
    waitUntil: "networkidle",
    timeout: 60000
  });

  await page.waitForTimeout(5000);

  console.log("Looking for 24-hour link...");

  const links = page.locator("a").filter({
    hasText: "24時間"
  });

  const linkCount = await links.count();

  console.log("24-hour links:", linkCount);

  if (linkCount === 0) {
    console.log("ERROR: 24-hour link not found.");
  } else {
    await links.first().click();

    console.log("24-hour link clicked.");

    await page.waitForTimeout(5000);
  }

  const validNumber = (value) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100;

  const validSentiment =
    latestSentiment !== null &&
    validNumber(latestSentiment.negative) &&
    validNumber(latestSentiment.positive) &&
    latestSentiment.negative + latestSentiment.positive > 0;

  if (validSentiment) {
    console.log("");
    console.log("24-HOUR RESULT");
    console.log("negative:", latestSentiment.negative);
    console.log("positive:", latestSentiment.positive);

    results.push({
      keyword,
      date: new Date().toISOString().slice(0, 10),
      negative: latestSentiment.negative,
      positive: latestSentiment.positive,
      status: "取得済み"
    });
  } else {
    console.log("ERROR: Valid 24-hour sentiment not captured.");
    console.log(
      "Latest result:",
      JSON.stringify(latestSentiment)
    );

    results.push({
      keyword,
      date: new Date().toISOString().slice(0, 10),
      negative: latestSentiment?.negative ?? null,
      positive: latestSentiment?.positive ?? null,
      status: "データ不足"
    });
  }

  debugResults.push({
    keyword,
    capturedAt: new Date().toISOString(),
    responseCount: stockDebug.length,
    responses: stockDebug
  });

  await page.close();

  await new Promise(resolve => setTimeout(resolve, 1000));
}

await browser.close();

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      stocks: results
    },
    null,
    2
  )
);

fs.writeFileSync(
  debugPath,
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      methodVersion: "debug-v2",
      stocks: debugResults
    },
    null,
    2
  )
);

console.log("");
console.log("====================================");
console.log("SAVED");
console.log("====================================");
console.log(outputPath);
console.log(debugPath);
console.log("stocks:", results.length);
console.log(
  "valid:",
  results.filter(stock => stock.status === "取得済み").length
);
console.log(
  "unavailable:",
  results.filter(stock => stock.status === "データ不足").length
);
