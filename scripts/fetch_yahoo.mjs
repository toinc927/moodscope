import fs from "fs";

const url =
  "https://search.yahoo.co.jp/realtime/api/v1/pagination" +
  "?p=" +
  encodeURIComponent("メタプラネット") +
  "&md=h" +
  "&results=40";

console.log("====================================");
console.log("Yahoo pagination diagnostic");
console.log("====================================");
console.log("URL:");
console.log(url);

const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

console.log("");
console.log("HTTP status:", response.status);

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const json = await response.json();

console.log("");
console.log("Top-level keys:");
console.log(Object.keys(json));

console.log("");
console.log("timeline keys:");
console.log(
  Object.keys(json?.timeline || {})
);

console.log("");
console.log("head:");
console.log(
  JSON.stringify(
    json?.timeline?.head || {},
    null,
    2
  )
);

console.log("");
console.log("entry count:");

const entries =
  json?.timeline?.entry ||
  json?.timeline?.entries ||
  [];

console.log(
  Array.isArray(entries)
    ? entries.length
    : "not array"
);

console.log("");
console.log("First entry:");

if (Array.isArray(entries) && entries.length > 0) {
  console.log(
    JSON.stringify(
      entries[0],
      null,
      2
    )
  );
} else {
  console.log("No entry found.");
}

console.log("");
console.log("====================================");
console.log("Diagnostic finished");
console.log("====================================");
