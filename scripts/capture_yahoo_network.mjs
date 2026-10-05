import { chromium } from "playwright";

const keyword = "メタプラネット";

console.log("====================================");
console.log("Yahoo 24-hour sentiment final test");
console.log("====================================");
console.log("STOCK:", keyword);
console.log("");

const browser = await chromium.launch({
  headless: true
});

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
console.log("====================================");
console.log("CLICKING REAL 24-HOUR LINK");
console.log("====================================");

const links =
  page
    .locator("a")
    .filter({
      hasText: "24時間"
    });

console.log(
  "24-hour links:",
  await links.count()
);

if (await links.count() === 0) {

  console.log(
    "ERROR: 24-hour link not found."
  );

} else {

  console.log(
    "Clicking first 24-hour link..."
  );

  await links.first().click();

  console.log(
    "24-hour link clicked."
  );

  await page.waitForTimeout(5000);
}

console.log("");
console.log("====================================");
console.log("FINAL RESULT");
console.log("====================================");

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

console.log("");
console.log("====================================");
console.log("TEST FINISHED");
console.log("====================================");

await browser.close();
