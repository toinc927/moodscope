import { chromium } from "playwright";

const keyword = "メタプラネット";

console.log("====================================");
console.log("Yahoo 24-hour control diagnostic");
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
console.log("24-HOUR ELEMENT DIAGNOSTIC");
console.log("====================================");

const candidates =
  await page
    .locator("text=24時間")
    .all();

console.log(
  "Candidates:",
  candidates.length
);

for (let i = 0; i < candidates.length; i++) {

  const candidate = candidates[i];

  try {

    console.log("");
    console.log(
      "--- CANDIDATE",
      i + 1,
      "---"
    );

    console.log(
      "visible:",
      await candidate.isVisible()
    );

    console.log(
      "text:",
      JSON.stringify(
        await candidate.textContent()
      )
    );

    console.log(
      "tag:",
      await candidate.evaluate(
        el => el.tagName
      )
    );

    console.log(
      "class:",
      await candidate.getAttribute(
        "class"
      )
    );

    console.log(
      "role:",
      await candidate.getAttribute(
        "role"
      )
    );

    console.log(
      "aria-label:",
      await candidate.getAttribute(
        "aria-label"
      )
    );

    console.log(
      "parent:",
      await candidate.evaluate(
        el => el.parentElement?.outerHTML?.slice(
          0,
          1000
        )
      )
    );

  } catch (error) {

    console.log(
      "Diagnostic error:",
      error.message
    );

  }

}

console.log("");
console.log("====================================");
console.log("BUTTON LIST");
console.log("====================================");

const buttons =
  await page.locator("button").all();

console.log(
  "button count:",
  buttons.length
);

for (let i = 0; i < buttons.length; i++) {

  try {

    const button = buttons[i];

    console.log("");
    console.log(
      "--- BUTTON",
      i + 1,
      "---"
    );

    console.log(
      "visible:",
      await button.isVisible()
    );

    console.log(
      "text:",
      JSON.stringify(
        await button.textContent()
      )
    );

    console.log(
      "aria-label:",
      await button.getAttribute(
        "aria-label"
      )
    );

  } catch (error) {

    console.log(
      "Button diagnostic error:",
      error.message
    );

  }

}

console.log("");
console.log("====================================");
console.log("DIAGNOSTIC FINISHED");
console.log("====================================");

await page.waitForTimeout(2000);

await browser.close();
