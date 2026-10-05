import { chromium } from "playwright";

const stocks = [
  "ファナック",
  "ソフトバンクグループ",
  "メタプラネット",
  "データセクション"
];

console.log("====================================");
console.log("Yahoo 24-hour sentiment test");
console.log("====================================");
console.log("");

const browser = await chromium.launch({
  headless: true
});

for (const keyword of stocks) {

  console.log("");
  console.log("====================================");
  console.log("STOCK:", keyword);
  console.log("====================================");

  const page = await browser.newPage();

  const captured = [];

  page.on("response", async (response) => {

    const url = response.url();

    if (!url.includes("/realtime/api/v1/transition")) {
      return;
    }

    try {

      const parsed = new URL(url);
      const data = await response.json();

      const sentiment = data?.sentimentPieChart;

      if (!sentiment) {
        return;
      }

      const parameters =
        Object.fromEntries(
          parsed.searchParams.entries()
        );

      console.log("");
      console.log(">>> TRANSITION API <<<");

      console.log(
        "span:",
        parameters.span
      );

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

      captured.push({
        parameters,
        sentiment
      });

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

  console.log("");
  console.log("Opening Yahoo...");

  await page.goto(
    yahooUrl,
    {
      waitUntil: "networkidle",
      timeout: 60000
    }
  );

  await page.waitForTimeout(5000);

  console.log("");
  console.log("Looking for 24-hour control...");

  const candidates =
    await page
      .locator("text=24時間")
      .all();

  console.log(
    "24-hour candidates:",
    candidates.length
  );

  let clicked = false;

  for (const candidate of candidates) {

    try {

      if (await candidate.isVisible()) {

        await candidate.click();

        clicked = true;

        console.log(
          "24-hour control clicked."
        );

        break;
      }

    } catch (error) {

      console.log(
        "Click failed:",
        error.message
      );

    }

  }

  if (!clicked) {

    console.log(
      "ERROR: 24-hour control was NOT found."
    );

  } else {

    await page.waitForTimeout(5000);

  }

  console.log("");
  console.log("RESULT:");

  if (captured.length === 0) {

    console.log(
      "No sentiment response captured."
    );

  } else {

    const latest =
      captured[captured.length - 1];

    console.log(
      "span:",
      latest.parameters.span
    );

    console.log(
      "samplingRate:",
      latest.parameters.samplingRate
    );

    console.log(
      "negative:",
      latest.sentiment.negative
    );

    console.log(
      "positive:",
      latest.sentiment.positive
    );

  }

  await page.close();

}

console.log("");
console.log("====================================");
console.log("ALL STOCKS TEST FINISHED");
console.log("====================================");

await browser.close();
