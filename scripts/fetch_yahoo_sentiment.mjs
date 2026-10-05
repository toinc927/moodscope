import { chromium } from "playwright";
import fs from "fs";

const stocks = [
  {
    keyword: "ファナック"
  },
  {
    keyword: "ソフトバンクグループ"
  },
  {
    keyword: "メタプラネット"
  },
  {
    keyword: "データセクション"
  }
];

const outputPath = "./data/yahoo_sentiment.json";

console.log("====================================");
console.log("Yahoo 24-hour sentiment fetch");
console.log("====================================");

const browser = await chromium.launch({
  headless: true
});

const results = [];

for (const stock of stocks) {

  const keyword = stock.keyword;

  console.log("");
  console.log("====================================");
  console.log("STOCK:", keyword);
  console.log("====================================");

  const page = await browser.newPage();

  let latestSentiment = null;

  page.on("response", async (response) => {

    const url = response.url();

    if (!url.includes("/realtime/api/v1/transition")) {
      return;
    }

    try {

      const parsed = new URL(url);
      const data = await response.json();

      const sentiment =
        data?.sentimentPieChart;

      if (!sentiment) {
        return;
      }

      const parameters =
        Object.fromEntries(
          parsed.searchParams.entries()
        );

      console.log("");
      console.log("TRANSITION API");
      console.log("span:", parameters.span);
      console.log(
        "samplingRate:",
        parameters.samplingRate
      );
      console.log(
        "negative:",
        sentiment.negative
      );
      console.log(
        "positive:",
        sentiment.positive
      );

      if (
        parameters.span === "86400" &&
        parameters.samplingRate === "100"
      ) {

        latestSentiment = {
          negative: sentiment.negative,
          positive: sentiment.positive
        };

      }

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

  await page.goto(
    yahooUrl,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  await page.waitForTimeout(5000);

  console.log(
    "Looking for 24-hour link..."
  );

  const links =
    page
      .locator("a")
      .filter({
        hasText: "24時間"
      });

  const linkCount =
    await links.count();

  console.log(
    "24-hour links:",
    linkCount
  );

  if (linkCount === 0) {

    console.log(
      "ERROR: 24-hour link not found."
    );

  } else {

    await links.first().click();

    console.log(
      "24-hour link clicked."
    );

    await page.waitForTimeout(5000);

  }

  if (latestSentiment) {

    console.log("");
    console.log("24-HOUR RESULT");
    console.log(
      "negative:",
      latestSentiment.negative
    );
    console.log(
      "positive:",
      latestSentiment.positive
    );

    results.push({
      keyword,
      date: new Date()
        .toISOString()
        .slice(0, 10),
      negative:
        latestSentiment.negative,
      positive:
        latestSentiment.positive
    });

  } else {

    console.log(
      "ERROR: 24-hour sentiment not captured."
    );

    results.push({
      keyword,
      date: new Date()
        .toISOString()
        .slice(0, 10),
      negative: null,
      positive: null
    });

  }

  await page.close();

  await new Promise(
    resolve => setTimeout(resolve, 1000)
  );
}

await browser.close();

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      updatedAt:
        new Date().toISOString(),
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

console.log(
  outputPath
);

console.log(
  "stocks:",
  results.length
);
