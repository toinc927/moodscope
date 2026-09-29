import { chromium } from "playwright";

const keyword = "ファナック";

console.log("====================================");
console.log("Yahoo sentiment 6h vs 24h test");
console.log("keyword:", keyword);
console.log("====================================");

const browser = await chromium.launch({
  headless: true
});

const page = await browser.newPage();

let originalUrl = null;
let originalData = null;

page.on("response", async (response) => {
  const url = response.url();

  if (
    url.includes("/realtime/api/v1/transition") &&
    url.includes("span=21600")
  ) {
    try {
      const data = await response.json();

      originalUrl = url;
      originalData = data;

      console.log("");
      console.log(">>> ORIGINAL 6-HOUR API FOUND <<<");
      console.log("STATUS:", response.status());
      console.log("");
      console.log("6-HOUR SENTIMENT:");

      if (data.sentimentPieChart) {
        console.log(
          JSON.stringify(
            data.sentimentPieChart,
            null,
            2
          )
        );
      } else {
        console.log("NOT FOUND");
      }

    } catch (error) {
      console.log(
        "6-hour response parse error:",
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

await page.goto(yahooUrl, {
  waitUntil: "networkidle",
  timeout: 60000
});

await page.waitForTimeout(5000);

console.log("");
console.log("====================================");
console.log("ORIGINAL REQUEST");
console.log("====================================");

if (!originalUrl) {
  console.log("Original 6-hour transition API was not captured.");
  await browser.close();
  process.exit(1);
}

console.log(originalUrl);

const originalParsed = new URL(originalUrl);

console.log("");
console.log("Original parameters:");

for (const [key, value] of originalParsed.searchParams.entries()) {
  console.log(`${key}: ${value}`);
}

console.log("");
console.log("====================================");
console.log("REQUESTING 24-HOUR VERSION");
console.log("====================================");

const url24 = new URL(originalUrl);

url24.searchParams.set("span", "86400");

console.log("");
console.log("24-hour URL:");
console.log(url24.toString());

try {
  const response24 = await page.request.get(
    url24.toString(),
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
      }
    }
  );

  console.log("");
  console.log("24-hour HTTP STATUS:");
  console.log(response24.status());

  const data24 = await response24.json();

  console.log("");
  console.log("====================================");
  console.log("6-HOUR RESULT");
  console.log("====================================");

  if (originalData?.sentimentPieChart) {
    console.log(
      JSON.stringify(
        originalData.sentimentPieChart,
        null,
        2
      )
    );
  } else {
    console.log("NOT FOUND");
  }

  console.log("");
  console.log("====================================");
  console.log("24-HOUR RESULT");
  console.log("====================================");

  if (data24.sentimentPieChart) {
    console.log(
      JSON.stringify(
        data24.sentimentPieChart,
        null,
        2
      )
    );
  } else {
    console.log("NOT FOUND");
  }

  console.log("");
  console.log("====================================");
  console.log("COMPARISON");
  console.log("====================================");

  const sixHour =
    originalData?.sentimentPieChart;

  const twentyFourHour =
    data24?.sentimentPieChart;

  console.log("");
  console.log("6-hour:");
  console.log(
    "positive =",
    sixHour?.positive
  );
  console.log(
    "negative =",
    sixHour?.negative
  );

  console.log("");
  console.log("24-hour:");
  console.log(
    "positive =",
    twentyFourHour?.positive
  );
  console.log(
    "negative =",
    twentyFourHour?.negative
  );

  console.log("");
  console.log("====================================");

  if (
    sixHour &&
    twentyFourHour &&
    (
      sixHour.positive !== twentyFourHour.positive ||
      sixHour.negative !== twentyFourHour.negative
    )
  ) {
    console.log(
      "RESULT: 6-hour and 24-hour data are DIFFERENT."
    );
    console.log(
      "The span parameter changes the sentiment period."
    );
  } else if (
    sixHour &&
    twentyFourHour &&
    sixHour.positive === twentyFourHour.positive &&
    sixHour.negative === twentyFourHour.negative
  ) {
    console.log(
      "RESULT: 6-hour and 24-hour data are IDENTICAL."
    );
    console.log(
      "The period behavior needs further investigation."
    );
  } else {
    console.log(
      "RESULT: Could not compare both sentiment results."
    );
  }

} catch (error) {
  console.log("");
  console.log("24-hour request failed.");
  console.log(error.message);
}

console.log("");
console.log("====================================");
console.log("TEST FINISHED");
console.log("====================================");

await browser.close();
