import { chromium } from "playwright";

const keyword = "ファナック";

console.log("====================================");
console.log("Yahoo sentiment period test");
console.log("keyword:", keyword);
console.log("====================================");

const browser = await chromium.launch({
  headless: true
});

const page = await browser.newPage();

let transitionResponse = null;

page.on("response", async (response) => {
  const url = response.url();

  if (
    url.includes("/realtime/api/v1/transition") &&
    url.includes("sentiment")
  ) {
    try {
      const data = await response.json();

      transitionResponse = {
        url,
        status: response.status(),
        data
      };

      console.log("");
      console.log(">>> TRANSITION API FOUND <<<");
      console.log("STATUS:", response.status());
      console.log("URL:");
      console.log(url);

      console.log("");
      console.log("SENTIMENT PIE CHART:");

      if (data.sentimentPieChart) {
        console.log(JSON.stringify(
          data.sentimentPieChart,
          null,
          2
        ));
      } else {
        console.log("NOT FOUND");
      }

      console.log("");
      console.log("TOP LEVEL KEYS:");
      console.log(Object.keys(data));

    } catch (error) {
      console.log("Response JSON parse error");
      console.log(error.message);
    }
  }
});

const yahooUrl =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent(keyword);

console.log("");
console.log("Opening:");
console.log(yahooUrl);

await page.goto(yahooUrl, {
  waitUntil: "networkidle",
  timeout: 60000
});

await page.waitForTimeout(5000);

console.log("");
console.log("PAGE TITLE:");
console.log(await page.title());

console.log("");
console.log("PAGE TEXT SENTIMENT SEARCH:");

const bodyText = await page.locator("body").innerText();

const lines = bodyText
  .split("\n")
  .map(x => x.trim())
  .filter(x =>
    x.includes("ポジティブ") ||
    x.includes("ネガティブ") ||
    x.includes("感情の割合")
  );

if (lines.length > 0) {
  for (const line of lines) {
    console.log(line);
  }
} else {
  console.log("No visible sentiment text found.");
}

console.log("");
console.log("====================================");
console.log("FINAL RESULT");
console.log("====================================");

if (transitionResponse) {
  console.log("Transition API: FOUND");

  const sentiment =
    transitionResponse.data.sentimentPieChart;

  if (sentiment) {
    console.log(
      "positive:",
      sentiment.positive
    );

    console.log(
      "negative:",
      sentiment.negative
    );

    console.log(
      "shouldRender:",
      sentiment.shouldRender
    );
  }

  console.log("");
  console.log("Request parameters:");

  const apiUrl = new URL(
    transitionResponse.url
  );

  for (const [key, value] of apiUrl.searchParams.entries()) {
    console.log(`${key}: ${value}`);
  }

} else {
  console.log("Transition API: NOT FOUND");
}

await browser.close();

console.log("");
console.log("====================================");
console.log("TEST FINISHED");
console.log("====================================");
