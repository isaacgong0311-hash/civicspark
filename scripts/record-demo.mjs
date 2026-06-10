import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/demo");
const SITE = process.env.DEMO_URL || "https://civicspark.vercel.app";
const ZIP = "78701";
const W = 1280, H = 720;

// Scene start times (seconds) derived from the narration's scene-break pauses.
const T = {
  s2: 31.96, s3: 51.47, s4: 71.30, s5: 99.02, s6: 120.46, end: 146.48,
  // intermediate beats for tighter sync
  openBill: 65.0, perspectives: 88.0, generate: 108.0,
};

const CURSOR_JS = `
  (() => {
    if (document.getElementById('__democursor')) return;
    const c = document.createElement('div');
    c.id = '__democursor';
    Object.assign(c.style, { position:'fixed', top:'0', left:'0', width:'22px', height:'22px',
      zIndex:'2147483647', pointerEvents:'none', transform:'translate(-2px,-2px)', transition:'transform 0.04s linear' });
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="1.5"><path d="M5 3l5.5 14 2.2-5.8L18.5 9 5 3z"/></svg>';
    document.documentElement.appendChild(c);
    window.__moveCursor = (x, y) => { c.style.transform = 'translate('+x+'px,'+y+'px)'; };
    document.addEventListener('mousemove', e => window.__moveCursor(e.clientX, e.clientY), true);
  })();
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const tContext = Date.now();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT_DIR, size: { width: W, height: H } },
  });
  const page = await context.newPage();
  await page.addInitScript(CURSOR_JS);

  let mouseX = W / 2, mouseY = H / 2;
  let t0 = Date.now(); // set precisely once landing is painted
  const elapsed = () => (Date.now() - t0) / 1000;
  const gate = async (target) => { while (elapsed() < target) await sleep(40); };
  const ensureCursor = () => page.evaluate(CURSOR_JS).catch(() => {});

  async function glideTo(x, y, steps = 26) {
    const sx = mouseX, sy = mouseY;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      await page.mouse.move(sx + (x - sx) * e, sy + (y - sy) * e);
      await sleep(11);
    }
    mouseX = x; mouseY = y;
  }
  async function clickLocator(locator) {
    await ensureCursor();
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(200);
    const box = await locator.boundingBox();
    if (box) await glideTo(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(150);
    await locator.click({ timeout: 15000 }).catch(() => {});
    await sleep(300);
  }
  async function scrollBy(totalY, steps = 26) {
    const per = totalY / steps;
    for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, per); await sleep(26); }
  }
  async function scrollDrawer(totalY) { await glideTo(1000, 380); await scrollBy(totalY); }

  try {
    // ── SCENE 1: Landing (0 → 31.96) ──────────────────────────────────
    await page.goto(SITE, { waitUntil: "networkidle", timeout: 60000 });
    await ensureCursor();
    await sleep(400);
    t0 = Date.now(); // ← video content clock starts here (landing painted)
    await sleep(4000);
    await scrollBy(380); await sleep(3500);
    await scrollBy(360); await sleep(3500);
    await scrollBy(360); await sleep(3500);
    await scrollBy(340); await sleep(3000);
    await scrollBy(-1300);
    await gate(T.s2);

    // ── SCENE 2: Representatives (31.96 → 51.47) ──────────────────────
    await page.goto(`${SITE}/representatives`, { waitUntil: "networkidle" });
    await ensureCursor();
    await sleep(800);
    const zip = page.getByPlaceholder("ZIP code");
    await clickLocator(zip);
    await zip.type(ZIP, { delay: 220 });
    await sleep(900);
    await clickLocator(page.getByRole("button", { name: /Find My Reps/i }));
    await page.waitForTimeout(4000);
    await scrollBy(260); await sleep(1500);
    const seeLeg = page.getByText(/Recent Legislation/i).first();
    if (await seeLeg.isVisible().catch(() => false)) {
      await clickLocator(seeLeg);
      await page.waitForTimeout(3000);
    }
    await gate(T.s3);

    // ── SCENE 3: Bills + search, open a bill (51.47 → 71.30) ──────────
    await page.goto(`${SITE}/bills`, { waitUntil: "networkidle" });
    await ensureCursor();
    await sleep(2000);
    await scrollBy(260); await sleep(1500);
    const searchBox = page.getByPlaceholder(/Search all bills/i);
    if (await searchBox.isVisible().catch(() => false)) {
      await clickLocator(searchBox);
      await searchBox.type("veterans", { delay: 150 });
      await page.waitForTimeout(3000);
      const clearBtn = page.getByRole("button", { name: /Clear search/i });
      if (await clearBtn.isVisible().catch(() => false)) { await sleep(1500); await clickLocator(clearBtn); }
    }
    await scrollBy(-150);
    await gate(T.openBill); // open the bill ~6s before scene 4 so AI can load
    await clickLocator(page.getByRole("button", { name: /Take Action/i }).first());
    await page.waitForTimeout(2500);
    await gate(T.s4);

    // ── SCENE 4: AI overview + perspectives (71.30 → 99.02) ───────────
    await scrollDrawer(200); await sleep(3000);
    await scrollDrawer(180); await sleep(3000);
    await scrollDrawer(-380);
    await gate(T.perspectives);
    const perspTab = page.getByRole("tab", { name: /Perspectives/i });
    if (await perspTab.isVisible().catch(() => false)) {
      await clickLocator(perspTab);
      await page.waitForTimeout(4000);
      await scrollDrawer(200);
    }
    await gate(T.s5);

    // ── SCENE 5: Take Action — generate a letter (99.02 → 120.46) ─────
    const actTab = page.getByRole("tab", { name: /Take Action/i });
    if (await actTab.isVisible().catch(() => false)) { await clickLocator(actTab); await sleep(1200); }
    const support = page.getByRole("button", { name: /^Support$/i }).first();
    if (await support.isVisible().catch(() => false)) { await clickLocator(support); await sleep(1200); }
    const note = page.getByPlaceholder(/personal story/i);
    if (await note.isVisible().catch(() => false)) {
      await clickLocator(note);
      await note.type("As a high school student, this issue directly affects my community.", { delay: 40 });
    }
    await gate(T.generate);
    const genLetter = page.getByRole("button", { name: /Generate Letter/i });
    if (await genLetter.isVisible().catch(() => false)) {
      await clickLocator(genLetter);
      await page.waitForTimeout(6000);
      await scrollDrawer(240);
    }
    await gate(T.s6);

    // ── SCENE 6: Tech stack + close (120.46 → 146.48) ─────────────────
    await page.goto(`${SITE}/how-it-works`, { waitUntil: "networkidle" });
    await ensureCursor();
    await sleep(2500);
    await scrollBy(520); await sleep(4000);
    await scrollBy(420); await sleep(4000);
    await page.goto(SITE, { waitUntil: "networkidle" });
    await ensureCursor();
    await gate(T.end + 1.0); // pad ~1s so muxing can trim cleanly to audio length
  } catch (err) {
    console.error("Recording flow error (video still saved):", err.message);
  } finally {
    const offset = (t0 - tContext) / 1000;
    fs.writeFileSync(path.join(OUT_DIR, "offset.txt"), String(offset));
    console.log("VIDEO_OFFSET_SEC:" + offset.toFixed(3));
    await context.close();
    await browser.close();
  }
  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
  console.log("VIDEO_FILES:" + JSON.stringify(files));
}

main();
