import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";
const origin = process.env.TEST_ORIGIN ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({
  executablePath:
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(origin);
await page.getByText("Your rules.").waitFor();
await page.getByRole("button", { name: "Review all requests" }).waitFor();
await page.waitForTimeout(3000);
await page.getByRole("button", { name: "Connections", exact: true }).click();
await page.getByRole("heading", { name: "Deployed contracts" }).waitFor();
await page.locator(".contracts a").first().waitFor({ timeout: 60000 });
assert.equal(await page.locator(".contracts a").count(), 3);
await page.getByRole("button", { name: "Overview", exact: true }).click();
await page.getByRole("button", { name: "Open operator access" }).click();
await page.getByRole("dialog").waitFor();
await page.getByRole("button", { name: "Close operator access" }).click();
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
mkdirSync("docs", { recursive: true });
await page.screenshot({ path: "docs/dashboard-desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
await page.screenshot({ path: "docs/dashboard-mobile.png", fullPage: true });
assert.deepEqual(errors, []);
console.log(
  "Browser checks passed: connections, contract links, operator modal, desktop and mobile layouts, no browser errors.",
);
await browser.close();
