import { chromium } from "playwright";

const keyword = "ファナック";

console.log("====================================");
console.log("Yahoo sentiment period test");
console.log("====================================");
console.log("keyword:", keyword);
console.log("");

const browser = await chromium.launch({
  headless: true
});

const page = await browser.newPage();

const captured = [];

async function captureTransition(label) {
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

      console.log("");
      console.log(">>> TRANSITION API <<<");
      console.log("LABEL:", label);
      console.log("STATUS:", response.status());

      console.log("");
      console.log("PARAMETERS:");

      for (
        const [key, value]
        of parsed.searchParams.entries()
      ) {
        console.log(
          `${key}: ${value}`
        );
      }

      console.log("");
      console.log("SENTIMENT:");

      if (sentiment) {
        console.log(
          JSON.stringify(
            sentiment,
            null,
            2
          )
        );

        captured.push({
          label,
          url,
          parameters:
            Object.fromEntries(
              parsed.searchParams.entries()
            ),
          sentiment
        });
      } else {
        console.log("NOT FOUND");
      }

    } catch (error) {
      console.log(
        "Response parse error:",
        error.message
      );
    }
  });
}

await captureTransition("initial");

const yahooUrl =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent(keyword);

console.log("");
console.log("Opening Yahoo:");
console.log(yahooUrl);

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
console.log("LOOKING FOR 24-HOUR CONTROL");
console.log("====================================");

const candidates = await page
  .locator("text=24時間")
  .all();

console.log(
  "24-hour text candidates:",
  candidates.length
);

let clicked = false;

for (const candidate of candidates) {

  try {

    if (await candidate.isVisible()) {

      console.log(
        "Clicking visible 24-hour control"
      );

      await candidate.click();

      clicked = true;

      break;
    }

  } catch (error) {

    console.log(
      "Candidate click failed:",
      error.message
    );

  }
}

if (!clicked) {

  console.log(
    "24-hour control was NOT found."
  );

  console.log("");
  console.log("Visible buttons:");

  const buttons =
    await page.locator("button").allTextContents();

  for (const text of buttons) {
    console.log(
      JSON.stringify(text)
    );
  }

} else {

  console.log("");
  console.log(
    "24-hour control clicked."
  );

  await page.waitForTimeout(5000);
}

console.log("");
console.log("====================================");
console.log("CAPTURE SUMMARY");
console.log("====================================");

console.log(
  "Transition responses:",
  captured.length
);

for (
  let i = 0;
  i < captured.length;
  i++
) {

  console.log("");
  console.log(
    `--- RESULT ${i + 1} ---`
  );

  console.log(
    JSON.stringify(
      captured[i],
      null,
      2
    )
  );
}

console.log("");
console.log("====================================");
console.log("TEST FINISHED");
console.log("====================================");

await browser.close();
