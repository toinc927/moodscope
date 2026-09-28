import { chromium } from "playwright";

const keyword = "ファナック";

const url =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent(keyword);

console.log("==================================================");
console.log("Yahoo network capture");
console.log("==================================================");
console.log(`URL: ${url}`);

const browser = await chromium.launch({
  headless: true
});

const page = await browser.newPage();

const captured = [];

page.on("response", async (response) => {
  const responseUrl = response.url();

  if (!responseUrl.includes("/realtime/api/v1/")) {
    return;
  }

  console.log("");
  console.log("##################################################");
  console.log("REALTIME API RESPONSE");
  console.log("##################################################");
  console.log(`STATUS: ${response.status()}`);
  console.log(`URL: ${responseUrl}`);

  try {
    const text = await response.text();

    console.log("");
    console.log("RESPONSE BODY:");
    console.log(text.slice(0, 20000));

    captured.push({
      url: responseUrl,
      status: response.status(),
      body: text
    });

  } catch (error) {
    console.log(`BODY ERROR: ${error.message}`);
  }
});

page.on("request", (request) => {
  const requestUrl = request.url();

  if (!requestUrl.includes("/realtime/api/v1/")) {
    return;
  }

  console.log("");
  console.log("==================================================");
  console.log("REALTIME API REQUEST");
  console.log("==================================================");
  console.log(requestUrl);
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
console.log("CAPTURE SUMMARY");
console.log("==================================================");
console.log(`CAPTURED API RESPONSES: ${captured.length}`);

for (const item of captured) {
  console.log("");
  console.log(`URL: ${item.url}`);
  console.log(`STATUS: ${item.status}`);

  if (
    item.body.includes("sentimentPieChart") ||
    item.body.includes("positive") ||
    item.body.includes("negative")
  ) {
    console.log(">>> SENTIMENT DATA FOUND <<<");
  }
}

await browser.close();

console.log("");
console.log("==================================================");
console.log("FINISHED");
console.log("==================================================");
