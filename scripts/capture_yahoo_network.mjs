import { chromium } from "playwright";

const keyword = "ファナック";

const url =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent(keyword);

console.log("==================================================");
console.log("Yahoo sentiment API capture");
console.log("==================================================");
console.log(`KEYWORD: ${keyword}`);
console.log(`PAGE URL: ${url}`);

const browser = await chromium.launch({
  headless: true
});

const page = await browser.newPage();

let foundTransition = false;

page.on("request", (request) => {
  const requestUrl = request.url();

  if (!requestUrl.includes("/realtime/api/v1/transition")) {
    return;
  }

  console.log("");
  console.log("##################################################");
  console.log("TRANSITION API REQUEST");
  console.log("##################################################");
  console.log(requestUrl);
});

page.on("response", async (response) => {
  const responseUrl = response.url();

  if (!responseUrl.includes("/realtime/api/v1/transition")) {
    return;
  }

  foundTransition = true;

  console.log("");
  console.log("##################################################");
  console.log("TRANSITION API RESPONSE");
  console.log("##################################################");
  console.log(`STATUS: ${response.status()}`);
  console.log(`URL: ${responseUrl}`);

  try {
    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      console.log("");
      console.log("JSON PARSE: FAILED");
      console.log("");
      console.log(text.slice(0, 5000));
      return;
    }

    console.log("");
    console.log("==================================================");
    console.log("TOP LEVEL KEYS");
    console.log("==================================================");

    console.log(Object.keys(data));

    console.log("");
    console.log("==================================================");
    console.log("SENTIMENT PIE CHART");
    console.log("==================================================");

    if (data.sentimentPieChart) {
      console.log(">>> SENTIMENT PIE CHART FOUND <<<");

      console.log(
        JSON.stringify(
          data.sentimentPieChart,
          null,
          2
        )
      );
    } else {
      console.log(">>> sentimentPieChart NOT FOUND <<<");
    }

    console.log("");
    console.log("==================================================");
    console.log("SENTIMENT RELATED KEYS");
    console.log("==================================================");

    const keys = Object.keys(data);

    const sentimentKeys = keys.filter(key =>
      key.toLowerCase().includes("sentiment")
    );

    if (sentimentKeys.length > 0) {
      console.log(sentimentKeys);
    } else {
      console.log("No top-level sentiment keys found.");
    }

    console.log("");
    console.log("==================================================");
    console.log("POSITIVE / NEGATIVE SEARCH");
    console.log("==================================================");

    const jsonText = JSON.stringify(data);

    console.log(
      `contains "positive": ${jsonText.includes("positive")}`
    );

    console.log(
      `contains "negative": ${jsonText.includes("negative")}`
    );

    console.log(
      `contains "dataPositive": ${jsonText.includes("dataPositive")}`
    );

    console.log(
      `contains "dataNegative": ${jsonText.includes("dataNegative")}`
    );

  } catch (error) {
    console.log("");
    console.log(`RESPONSE ERROR: ${error.message}`);
  }
});

try {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });

  console.log("");
  console.log("PAGE LOADED");

  await page.waitForTimeout(10000);

} catch (error) {
  console.log("");
  console.log(`PAGE ERROR: ${error.message}`);
}

console.log("");
console.log("==================================================");
console.log("FINAL RESULT");
console.log("==================================================");

if (foundTransition) {
  console.log("TRANSITION API: FOUND");
} else {
  console.log("TRANSITION API: NOT FOUND");
}

await browser.close();

console.log("");
console.log("==================================================");
console.log("FINISHED");
console.log("==================================================");
