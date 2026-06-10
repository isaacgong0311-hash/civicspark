import { chromium } from "playwright";
const SITE = "https://civicspark.vercel.app";
const page = await (await (await chromium.launch()).newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 })).newPage();

// Replicate the real recording path: ZIP lookup first so reps persist to sessionStorage
await page.goto(`${SITE}/representatives`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.getByPlaceholder("ZIP code").fill("78701");
await page.getByRole("button", { name: /Find My Reps/i }).click();
await page.waitForTimeout(4000);

await page.goto(`${SITE}/bills`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /Take Action/i }).first().click();
await page.waitForTimeout(6000); // AI overview
await page.screenshot({ path: "/tmp/v_overview.jpg", quality: 80, type: "jpeg" });

const persp = page.getByRole("tab", { name: /Perspectives/i });
if (await persp.isVisible().catch(() => false)) { await persp.click(); await page.waitForTimeout(5000); }
await page.screenshot({ path: "/tmp/v_persp.jpg", quality: 80, type: "jpeg" });

await page.getByRole("tab", { name: /Take Action/i }).click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /^Support$/i }).first().click().catch(() => {});
await page.waitForTimeout(500);
const note = page.getByPlaceholder(/personal story/i);
if (await note.isVisible().catch(() => false)) await note.fill("As a high school student, this affects my community.");
await page.getByRole("button", { name: /Generate Letter/i }).click().catch(() => {});
await page.waitForTimeout(7000);
await page.screenshot({ path: "/tmp/v_letter.jpg", quality: 80, type: "jpeg" });
console.log("done");
process.exit(0);
