import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 5298;
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.resolve(ROOT_DIR, "docs/demo");
const ARTIFACT_DIR = "/Users/suganuma_ryohei/.gemini/antigravity/brain/0e9c22c6-6d00-4323-8e96-866f3699bb47";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// タップの視覚化用CSS/JSをページに注入
async function injectTouchIndicator(page) {
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .touch-indicator {
        position: fixed;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(91, 130, 102, 0.45);
        border: 2px solid rgba(91, 130, 102, 0.9);
        pointer-events: none;
        z-index: 9999999;
        transform: translate(-50%, -50%) scale(0.2);
        transition: transform 0.28s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.32s ease-out;
        box-shadow: 0 0 14px rgba(91, 130, 102, 0.5);
      }
      .touch-indicator.active {
        transform: translate(-50%, -50%) scale(1.35);
        opacity: 0;
      }
    `;
    document.head.appendChild(style);

    window.showTouch = (x, y) => {
      const dot = document.createElement("div");
      dot.className = "touch-indicator";
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      document.body.appendChild(dot);
      requestAnimationFrame(() => {
        dot.classList.add("active");
      });
      setTimeout(() => dot.remove(), 380);
    };

    document.addEventListener("click", (e) => {
      window.showTouch(e.clientX, e.clientY);
    }, true);
  });
}

async function clickWithTouch(page, selector, waitAfter = 600) {
  const el = await page.waitForSelector(selector, { state: "visible", timeout: 8000 });
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(150);
  const box = await el.boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.evaluate(({ x, y }) => window.showTouch && window.showTouch(x, y), { x, y });
  }
  await el.click();
  await sleep(waitAfter);
}

async function clickElement(page, element, waitAfter = 600) {
  await element.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(150);
  const box = await element.boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.evaluate(({ x, y }) => window.showTouch && window.showTouch(x, y), { x, y });
  }
  await element.click();
  await sleep(waitAfter);
}

async function waitModalClosed(page) {
  await sleep(400);
  await page.waitForSelector(".modal-overlay", { state: "detached", timeout: 4000 }).catch(() => {});
  await sleep(350);
}

async function closeModal(page) {
  const closeBtn = await page.$(".modal-close-icon-btn, .modal-close-btn");
  if (closeBtn) {
    await clickElement(page, closeBtn, 500);
  } else {
    await page.keyboard.press("Escape");
    await sleep(500);
  }
  await waitModalClosed(page);
}

async function humanType(page, selector, text, clearFirst = true) {
  const el = await page.waitForSelector(selector, { state: "visible", timeout: 8000 });
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(200);
  await clickElement(page, el, 200);
  if (clearFirst) {
    await el.fill("");
    await sleep(150);
  }
  await page.type(selector, text, { delay: 45 });
  await sleep(400);
}

async function main() {
  console.log("=== Starting Mobile Full UI Demo Video Recording ===");

  console.log("Launching Vite server on port " + PORT + "...");
  const vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });

  await sleep(2000);

  const tempVideoDir = path.resolve(ROOT_DIR, "tmp_recordings/mobile_ui");
  if (fs.existsSync(tempVideoDir)) {
    fs.rmSync(tempVideoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempVideoDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  // モバイル実機スケール（412 x 892、2xスケール）
  const context = await browser.newContext({
    viewport: { width: 412, height: 892 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 824, height: 1784 },
    },
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to app...");
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await injectTouchIndicator(page);
    await sleep(800);

    // データベース初期化
    await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = indexedDB.open("ration_db", 1);
        req.onsuccess = (e) => {
          const db = e.target.result;
          if (db.objectStoreNames.contains("meals_store")) {
            const tx = db.transaction("meals_store", "readwrite");
            tx.objectStore("meals_store").clear();
            tx.oncomplete = () => resolve();
          } else {
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await injectTouchIndicator(page);
    await sleep(1000);

    // シーン 1: 週移動
    console.log("Scene 1: Mobile Week Navigation");
    await clickWithTouch(page, "button.week-nav-btn[aria-label='前の週']", 600);
    await clickWithTouch(page, "button.btn-today-mini", 700);

    // シーン 2: ワンタップ自炊記録 ＆ Toastクイックタグ
    console.log("Scene 2: One-tap Record & Toast");
    const emptyCells = await page.$$(".meal-cell-empty");
    if (emptyCells.length > 0) {
      await clickElement(page, emptyCells[0], 700);
      const quickCards = await page.$$(".quick-emoji-card");
      if (quickCards.length > 0) {
        await clickElement(page, quickCards[0], 600);
        await waitModalClosed(page);
      }
      await sleep(250);
      const toastTag = await page.$(".toast-tag-chip:has-text('#自炊')");
      if (toastTag) await clickElement(page, toastTag, 700);
    }

    // シーン 3: 詳細入力
    console.log("Scene 3: Accordion Detail Input");
    const emptyCells2 = await page.$$(".meal-cell-empty");
    if (emptyCells2.length > 1) {
      await clickElement(page, emptyCells2[1], 700);
      const toggleDetailsBtn = await page.$(".btn-toggle-details");
      if (toggleDetailsBtn) await clickElement(page, toggleDetailsBtn, 500);

      const outCard = await page.$(".quick-emoji-card:has-text('外食')");
      if (outCard) await clickElement(page, outCard, 400);

      const tagHearty = await page.$(".tag-chip:has-text('ガッツリ')");
      if (tagHearty) await clickElement(page, tagHearty, 400);

      await humanType(page, ".custom-tag-input", "特製", true);
      const addTagBtn = await page.$(".btn-add-custom-tag");
      if (addTagBtn) await clickElement(page, addTagBtn, 400);

      await humanType(page, ".modal-note-input", "濃厚味噌ラーメン味玉つき", true);
      await clickWithTouch(page, ".btn-modal-primary", 800);
      await waitModalClosed(page);
    }

    // シーン 4: 休食
    console.log("Scene 4: Skip Meal");
    const emptyCells3 = await page.$$(".meal-cell-empty");
    if (emptyCells3.length > 2) {
      await clickElement(page, emptyCells3[2], 700);
      await clickWithTouch(page, ".hero-skip-btn", 700);
      await waitModalClosed(page);
    }

    // シーン 5: 下部FABカメラ
    console.log("Scene 5: Bottom FAB");
    await clickWithTouch(page, ".nav-primary-btn", 800);
    const storeCard = await page.$(".quick-emoji-card:has-text('コンビニ')");
    if (storeCard) {
      await clickElement(page, storeCard, 600);
      await waitModalClosed(page);
    } else {
      await closeModal(page);
    }

    // シーン 6: 1週間分データ投入
    console.log("Scene 6: Populate Full Week");
    await page.evaluate(async () => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const y = monday.getFullYear();
      const m = String(monday.getMonth() + 1).padStart(2, "0");
      const date = String(monday.getDate()).padStart(2, "0");
      const weekKey = `${y}-${m}-${date}`;

      const makeSvgImage = (bg, title, sub) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${bg}" />
              <stop offset="100%" stop-color="#2D312E" />
            </linearGradient>
          </defs>
          <rect width="600" height="450" fill="url(#g)"/>
          <circle cx="300" cy="200" r="90" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
          <text x="300" y="210" font-size="34" font-weight="700" fill="#FFFFFF" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">${title}</text>
          <text x="300" y="320" font-size="20" fill="#E2DDD5" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif">${sub}</text>
        </svg>`;
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      };

      const imgSteak = makeSvgImage("#8C533E", "自炊ステーキ", "ガーリックライス添え");
      const imgPizza = makeSvgImage("#C96F3B", "焼きたてピザ", "デリバリーで乾杯");
      const imgBurger = makeSvgImage("#B85D36", "特製バーガー", "金曜日のご褒美ランチ");
      const imgPancake = makeSvgImage("#C2934D", "ふわふわパンケーキ", "休日の朝カフェ風");

      const fullWeek = [
        [
          { style: "cook", iconKey: "pan", note: "サクサクのバタートースト", tags: ["自炊"] },
          { style: "out", iconKey: "utensils", note: "濃厚味噌ラーメン味玉つき", tags: ["外食", "特製"] },
          { image: imgSteak, note: "自炊ステーキとガーリックライス", tags: ["自炊", "ガッツリ"] }
        ],
        [
          { skipped: true },
          { style: "store", iconKey: "store", note: "コンビニ唐揚げ弁当", tags: ["コンビニ"] },
          { style: "cook", iconKey: "pan", note: "手作りスパイスチキンカレー", tags: ["自炊"] }
        ],
        [
          { style: "cook", iconKey: "pan", note: "鮭おにぎりと温かい緑茶", tags: ["自炊", "ヘルシー"] },
          { style: "cafe", iconKey: "coffee", note: "BLTサンドとアイスラテ", tags: ["カフェ"] },
          { image: imgPizza, note: "友達とデリバリーピザパーティー", tags: ["テイクアウト", "飲み会"] }
        ],
        [
          { style: "cook", iconKey: "pan", note: "オートミールとヨーグルト", tags: ["自炊", "ヘルシー"] },
          { style: "store", iconKey: "store", note: "ヘルシーサラダチキン", tags: ["コンビニ", "ヘルシー"] },
          { style: "out", iconKey: "utensils", note: "同僚と居酒屋焼き鳥盛り合わせ", tags: ["外食", "飲み会"] }
        ],
        [
          { style: "cafe", iconKey: "coffee", note: "朝の淹れたて深煎りコーヒー", tags: ["カフェ"] },
          { image: imgBurger, note: "金曜ご褒美の肉厚チーズバーガー", tags: ["外食", "ガッツリ"] },
          { style: "out", iconKey: "utensils", note: "回転寿司10皿満喫", tags: ["外食"] }
        ],
        [
          { image: imgPancake, note: "休日の手作りふわふわパンケーキ", tags: ["自炊"] },
          { style: "cook", iconKey: "pan", note: "生ハムとフレッシュトマトのパスタ", tags: ["自炊"] },
          { style: "cook", iconKey: "pan", note: "旬の野菜たっぷり寄せ鍋", tags: ["自炊", "ヘルシー"] }
        ],
        [
          { skipped: true },
          { style: "cook", iconKey: "pan", note: "自家製焼き餃子と白米", tags: ["自炊", "ガッツリ"] },
          { style: "cook", iconKey: "pan", note: "軽めの鯛茶漬けで静かな〆", tags: ["自炊", "ヘルシー"] }
        ]
      ];

      return new Promise((resolve) => {
        const req = indexedDB.open("ration_db", 1);
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction("meals_store", "readwrite");
          const store = tx.objectStore("meals_store");
          store.put(fullWeek, `ration_meals_${weekKey}`);
          tx.oncomplete = () => resolve();
        };
      });
    });

    await sleep(400);
    await page.reload({ waitUntil: "domcontentloaded" });
    await injectTouchIndicator(page);
    await sleep(1200);

    // シーン 7: 写真付きセル詳細
    console.log("Scene 7: Photo Polaroid Detail");
    const photoCell = await page.$(".meal-cell.meal-cell-filled");
    if (photoCell) {
      await clickElement(page, photoCell, 1600);
      await closeModal(page);
    }

    // シーン 8: シェアモーダル（比率切替・コメント・ズーム）
    console.log("Scene 8: Share Modal");
    const survivalCard = await page.$(".weekend-survival-card");
    if (survivalCard) {
      await clickElement(page, survivalCard, 2000);
    } else {
      await clickWithTouch(page, "button[aria-label='生存報告'], .nav-item:has-text('生存報告')", 2000);
    }

    const ratio916 = await page.$(".segmented-btn:has-text('9:16')");
    if (ratio916) await clickElement(page, ratio916, 1200);

    const ratio45 = await page.$(".segmented-btn:has-text('4:5')");
    if (ratio45) await clickElement(page, ratio45, 1200);

    const previewWrapper = await page.$(".share-preview-wrapper");
    if (previewWrapper) {
      await clickElement(page, previewWrapper, 1400);
      const lightboxClose = await page.$(".lightbox-close-btn");
      if (lightboxClose) {
        await clickElement(page, lightboxClose, 700);
      } else {
        await page.keyboard.press("Escape");
        await sleep(700);
      }
    }
    await closeModal(page);

    // シーン 9: 設定 & ナイトモード
    console.log("Scene 9: Settings & Night Mode");
    await clickWithTouch(page, "button[aria-label='設定'], .nav-item:has-text('設定')", 1000);
    const nightOption = await page.$(".theme-card-option:has-text('ナイト')");
    if (nightOption) await clickElement(page, nightOption, 1200);
    await closeModal(page);
    await sleep(1500);

    // 生成りに戻す
    await clickWithTouch(page, "button[aria-label='設定'], .nav-item:has-text('設定')", 900);
    const ecruOption = await page.$(".theme-card-option:has-text('生成り')");
    if (ecruOption) await clickElement(page, ecruOption, 1100);
    await closeModal(page);

    console.log("Final: Overview");
    await sleep(2000);

    console.log("Mobile UI demo finished!");
  } catch (err) {
    console.error("Recording error:", err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    vite.kill();
  }

  const files = fs.readdirSync(tempVideoDir).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const srcVideo = path.join(tempVideoDir, files[0]);
    const destVideo = path.join(OUTPUT_DIR, "demo_app_mobile.webm");
    const artifactVideo = path.join(ARTIFACT_DIR, "demo_app_mobile.webm");
    fs.copyFileSync(srcVideo, destVideo);
    fs.copyFileSync(srcVideo, artifactVideo);
    console.log("\nSuccess! Mobile UI Demo video saved to:");
    console.log(`- ${destVideo}`);
    console.log(`- ${artifactVideo}`);
  }
}

main().catch(console.error);
