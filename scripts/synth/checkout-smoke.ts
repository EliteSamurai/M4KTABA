// @ts-nocheck
import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/checkout");
  // Basic smoke: page renders
  await page.waitForSelector("text=Shipping");
  await browser.close();
})();
