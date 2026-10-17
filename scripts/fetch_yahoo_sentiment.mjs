import { chromium } from "playwright";
import fs from "fs";

const configPath = "./config/stocks.json";
const outputPath = "./data/yahoo_sentiment.json";

const stocks = JSON.parse(
  fs.readFileSync(configPath, "utf8")
);

console.log("====================================");
console.log("Yahoo 24-hour sentiment fetch v1.2");
console.log("====================================");
console.log("stocks:", stocks.length);

const browser = await chromium.launch({
  headless: true
});

const results = [];

function isValidPercentage(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

for (const stock of stocks) {
  const keyword = stock.keyword;

  console.log("");
  console.log("====================================");
  console.log("STOCK:", keyword);
  console.log("====================================");

  const page = await browser.newPage();

  let latestResult = null;

  page.on("response", async (response) => {
    const url = response.url();

    if (!url.includes("/realtime/api/v1/transition")) {
      return;
    }

    try {
      const parsed = new URL(url);
      const parameters = Object.fromEntries(
        parsed.searchParams.entries()
      );

      const data = await response.json();

      const sentiment = data?.sentimentPieChart;

      if (
        parameters.span !== "86400" ||
        parameters.samplingRate !== "100"
      ) {
        return;
      }

      const negative = sentiment?.negative;
      const positive = sentiment?.positive;
      const shouldRender = sentiment?.shouldRender;

      const transitionHead =
        data?.tweetTransition?.head ?? null;

      const totalResultsAvailable =
        transitionHead?.totalResultsAvailable ?? null;

      const validPercentages =
        isValidPercentage(negative) &&
        isValidPercentage(positive);

      const hasSentiment =
        validPercentages &&
        negative + positive > 0;

      const renderAllowed =
        shouldRender !== false;

      const status =
        response.status() === 200 &&
        renderAllowed &&
        hasSentiment
          ? "取得済み"
          : "データ不足";

      latestResult = {
        negative:
          isValidPercentage(negative)
            ? negative
            : null,
        positive:
          isValidPercentage(positive)
            ? positive
            : null,
        shouldRender:
          typeof shouldRender === "boolean"
            ? shouldRender
            : null,
        totalResultsAvailable,
        status,
        httpStatus: response.status()
      };

      console.log("");
      console.log("24-HOUR RESPONSE");
      console.log("keyword:", keyword);
      console.log("HTTP status:", response.status());
      console.log("negative:", negative);
      console.log("positive:", positive);
      console.log("shouldRender:", shouldRender);
      console.log(
        "totalResultsAvailable:",
        totalResultsAvailable
      );
      console.log("status:", status);
    } catch (error) {
      console.log(
        "Response parse error:",
        error.message
      );
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

  const links = page.locator("a").filter({
    hasText: "24時間"
  });

  const linkCount = await links.count();

  console.log("24-hour links:", linkCount);

  if (linkCount > 0) {
    await links.first().click();
    console.log("24-hour link clicked.");
    await page.waitForTimeout(5000);
  } else {
    console.log("ERROR: 24-hour link not found.");
  }

  if (latestResult === null) {
    console.log(
      "ERROR: Valid 24-hour response not captured."
    );

    results.push({
      keyword,
      date: new Date().toISOString().slice(0, 10),
      negative: null,
      positive: null,
      shouldRender: null,
      totalResultsAvailable: null,
      status: "データ不足",
      reason: "24時間センチメントを取得できませんでした"
    });
  } else {
    results.push({
      keyword,
      date: new Date().toISOString().slice(0, 10),
      negative: latestResult.negative,
      positive: latestResult.positive,
      shouldRender: latestResult.shouldRender,
      totalResultsAvailable:
        latestResult.totalResultsAvailable,
      status: latestResult.status,
      reason:
        latestResult.status === "取得済み"
          ? null
          : "センチメントが無効、または描画対象外です"
    });
  }

  await page.close();

  await new Promise(resolve => setTimeout(resolve, 1000));
}

await browser.close();

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      methodVersion: "v1.2",
      stocks: results
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
console.log("stocks:", results.length);

console.log(
  "取得済み:",
  results.filter(
    stock => stock.status === "取得済み"
  ).length
);

console.log(
  "データ不足:",
  results.filter(
    stock => stock.status === "データ不足"
  ).length
);
