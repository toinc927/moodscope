import { chromium } from "playwright";

const keyword = "ファナック";

console.log("====================================");
console.log("Yahoo sentiment network capture");
console.log("====================================");
console.log("keyword:", keyword);
console.log("");

const browser = await chromium.launch({
  headless: true
});

const page = await browser.newPage();

const captured = [];

page.on("response", async (response) => {
  const url = response.url();

  if (
    url.includes("/realtime/api/v1/transition")
  ) {
    console.log("");
    console.log(">>> TRANSITION API FOUND <<<");
    console.log("STATUS:", response.status());
    console.log("URL:");
    console.log(url);

    try {
      const parsed = new URL(url);

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

      const data = await response.json();

      const sentiment =
        data?.sentimentPieChart;

      if (sentiment) {
        console.log("");
        console.log("SENTIMENT:");

        console.log(
          JSON.stringify(
            sentiment,
            null,
            2
          )
        );

        captured.push({
          url,
          parameters:
            Object.fromEntries(
              parsed.searchParams.entries()
            ),
          sentiment
        });
      } else {
        console.log(
          "sentimentPieChart: NOT FOUND"
        );
      }

    } catch (error) {
      console.log(
        "Response parse error:",
        error.message
      );
    }
  }
});

const yahooUrl =
  "https://search.yahoo.co.jp/realtime/search?p=" +
  encodeURIComponent(keyword);

console.log("");
console.log("Opening Yahoo:");
console.log(yahooUrl);
console.log("");

await page.goto(
  yahooUrl,
  {
    waitUntil: "networkidle",
    timeout: 60000
  }
);

await page.waitForTimeout(10000);

console.log("");
console.log("====================================");
console.log("CAPTURE SUMMARY");
console.log("====================================");

console.log(
  "Transition responses:",
  captured.length
);

for (let i = 0; i < captured.length; i++) {

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

if (captured.length === 0) {

  console.log("");
  console.log(
    "No transition API was captured."
  );

  await browser.close();
  process.exit(1);
}

console.log("");
console.log("====================================");
console.log("TEST FINISHED");
console.log("====================================");

await browser.close();
