import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = path.resolve(ROOT_DIR, "docs/demo");
const ARTIFACT_DIR = "/Users/suganuma_ryohei/.gemini/antigravity/brain/8269469e-763b-4f5a-a289-cfd88b002770";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(43, 90, 83, 0.35);
        border: 2px solid rgba(43, 90, 83, 0.85);
        pointer-events: none;
        z-index: 9999999;
        transform: translate(-50%, -50%) scale(0.2);
        transition: transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.35s ease-out;
        box-shadow: 0 0 12px rgba(43, 90, 83, 0.4);
      }
      .touch-indicator.active {
        transform: translate(-50%, -50%) scale(1.3);
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
      setTimeout(() => dot.remove(), 400);
    };

    document.addEventListener("click", (e) => {
      window.showTouch(e.clientX, e.clientY);
    }, true);
  });
}

// 指定セレクタをタップ演出付きでクリック
async function clickWithTouch(page, selector, waitAfter = 800) {
  const el = await page.waitForSelector(selector, { state: "visible", timeout: 6000 });
  const box = await el.boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.evaluate(({ x, y }) => window.showTouch && window.showTouch(x, y), { x, y });
  }
  await el.click();
  await sleep(waitAfter);
}

async function main() {
  console.log("=== Starting Demo Recording ===");

  // 1. Vite preview サーバーを起動
  console.log("Launching Vite preview server...");
  const vite = spawn("npx", ["vite", "preview", "--port", String(PORT)], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });

  await sleep(1500);

  const tempVideoDir = path.resolve(ROOT_DIR, "tmp_recordings");
  if (fs.existsSync(tempVideoDir)) {
    fs.rmSync(tempVideoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempVideoDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  // モバイル端末（iPhone 15 Pro相当）のビューポートとアスペクト比で録画
  const context = await browser.newContext({
    viewport: { width: 412, height: 860 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 824, height: 1720 },
    },
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to app...");
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await injectTouchIndicator(page);
    await sleep(800);

    // データベースを一度クリーンにして初期画面からスタート
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

    await page.reload({ waitUntil: "networkidle" });
    await injectTouchIndicator(page);
    await sleep(1000);

    // ==========================================
    // シーン 1: 初期状態の7×3グリッド
    // ==========================================
    console.log("Scene 1: Initial Blank Grid");
    await page.mouse.wheel(0, 180);
    await sleep(600);
    await page.mouse.wheel(0, -180);
    await sleep(800);

    // ==========================================
    // シーン 2: 絵文字ワンタップで食事をクイック記録
    // ==========================================
    console.log("Scene 2: Quick Emoji Record");
    // 月曜 朝食（最初の空セル）をクリック
    const emptyCells = await page.$$(".meal-cell-empty");
    if (emptyCells.length > 0) {
      const box = await emptyCells[0].boundingBox();
      if (box) {
        await page.evaluate(({x, y}) => window.showTouch(x, y), { x: box.x + box.width/2, y: box.y + box.height/2 });
      }
      await emptyCells[0].click();
      await sleep(900);

      // 朝食絵文字（パン 🍞）をワンタップ
      const breadEmoji = await page.waitForSelector("button:has-text('🍞')", { timeout: 4000 });
      if (breadEmoji) {
        const bbox = await breadEmoji.boundingBox();
        if (bbox) await page.evaluate(({x, y}) => window.showTouch(x, y), { x: bbox.x + bbox.width/2, y: bbox.y + bbox.height/2 });
        await breadEmoji.click();
        await sleep(1200);
      }
    }

    // ==========================================
    // シーン 3: メモ・タグ付きで記録
    // ==========================================
    console.log("Scene 3: Record with Tag and Note");
    const emptyCellsAfter = await page.$$(".meal-cell-empty");
    if (emptyCellsAfter.length > 0) {
      const box = await emptyCellsAfter[0].boundingBox();
      if (box) {
        await page.evaluate(({x, y}) => window.showTouch(x, y), { x: box.x + box.width/2, y: box.y + box.height/2 });
      }
      await emptyCellsAfter[0].click();
      await sleep(800);

      // 「メモやタグをつける」アコーディオンを開く
      const toggleNoteBtn = await page.$(".btn-toggle-note");
      if (toggleNoteBtn) {
        await toggleNoteBtn.click();
        await sleep(500);
      }

      // 絵文字を選択（ラーメン 🍜）
      const ramenBtn = await page.$("button:has-text('🍜')");
      if (ramenBtn) {
        await ramenBtn.click();
        await sleep(400);
      }

      // タグ「外食」を選択
      const tagOut = await page.$("button:has-text('外食'), .tag-pill:has-text('外食')");
      if (tagOut) {
        await tagOut.click();
        await sleep(400);
      }

      // メモ入力
      const noteInput = await page.$(".note-textarea, textarea");
      if (noteInput) {
        await noteInput.fill("オフィス近くの濃厚味噌ラーメン 🍜");
        await sleep(600);
      }

      // 保存
      const saveBtn = await page.$(".btn-save-note");
      if (saveBtn) {
        await saveBtn.click();
        await sleep(1200);
      }
    }

    // ==========================================
    // シーン 4: 下部FABカメラからのスキップ（おやすみ）記録
    // ==========================================
    console.log("Scene 4: Camera FAB / Skip Record");
    await clickWithTouch(page, ".nav-primary-btn", 900);
    const skipBtn = await page.$(".btn-skip-pill, .btn-skip-action, button:has-text('おやすみ')");
    if (skipBtn) {
      const box = await skipBtn.boundingBox();
      if (box) await page.evaluate(({x, y}) => window.showTouch(x, y), { x: box.x + box.width/2, y: box.y + box.height/2 });
      await skipBtn.click();
      await sleep(1200);
    }

    // ==========================================
    // シーン 5: 一週間のフル記録データ投入 & スムーズスクロール
    // ==========================================
    console.log("Scene 5: Populate Full Week Meals and Scroll");
    await page.evaluate(async () => {
      // 日付ヘルパーと同様の週キーを計算
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const y = monday.getFullYear();
      const m = String(monday.getMonth() + 1).padStart(2, "0");
      const date = String(monday.getDate()).padStart(2, "0");
      const weekKey = `${y}-${m}-${date}`;

      const fullWeek = [
        // 月
        [
          { quickEmoji: "🍞", note: "トーストと目玉焼き ☕️", tags: ["自炊"] },
          { quickEmoji: "🍜", note: "オフィス近くの濃厚味噌ラーメン 🍜", tags: ["外食"] },
          { image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80", note: "自炊ステーキとごはん 🥩", tags: ["自炊"] }
        ],
        // 火
        [
          { skipped: true },
          { quickEmoji: "🍱", note: "コンビニ唐揚げ弁当", tags: ["コンビニ"] },
          { quickEmoji: "🍛", note: "レトルトカレー大盛り", tags: ["自炊"] }
        ],
        // 水
        [
          { quickEmoji: "🍙", note: "鮭おにぎりと緑茶", tags: ["自炊"] },
          { quickEmoji: "🥪", note: "BLTサンドウィッチ", tags: ["外食"] },
          { image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80", note: "友達とデリバリーピザ 🍕", tags: ["テイクアウト"] }
        ],
        // 木
        [
          { quickEmoji: "🥣", note: "オートミールとヨーグルト" },
          { quickEmoji: "🥗", note: "ヘルシーサラダチキン", tags: ["コンビニ"] },
          { quickEmoji: "🍺", note: "居酒屋で乾杯！焼き鳥", tags: ["外食"] }
        ],
        // 金
        [
          { quickEmoji: "☕️", note: "カフェラテのみ" },
          { image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80", note: "金曜ご褒美バーガー 🍔", tags: ["外食"] },
          { quickEmoji: "🍣", note: "回転寿司10皿！", tags: ["外食"] }
        ],
        // 土
        [
          { image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80", note: "休日のふわふわパンケーキ 🥞", tags: ["自炊"] },
          { quickEmoji: "🍝", note: "生ハムとトマトのパスタ", tags: ["自炊"] },
          { quickEmoji: "🍲", note: "家族と海鮮鍋", tags: ["自炊"] }
        ],
        // 日
        [
          { skipped: true },
          { quickEmoji: "🥟", note: "自家製焼き餃子とライス", tags: ["自炊"] },
          { quickEmoji: "🍶", note: "軽めのお茶漬けで〆", tags: ["自炊"] }
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
    await page.reload({ waitUntil: "networkidle" });
    await injectTouchIndicator(page);
    await sleep(1200);

    // グリッドを優雅にスクロール
    await page.mouse.wheel(0, 300);
    await sleep(900);
    await page.mouse.wheel(0, 300);
    await sleep(900);
    await page.mouse.wheel(0, -600);
    await sleep(1000);

    // ==========================================
    // シーン 6: 食事詳細モーダルの表示
    // ==========================================
    console.log("Scene 6: Open Meal Detail Modal");
    const photoCells = await page.$$(".meal-cell-photo");
    if (photoCells.length > 0) {
      const box = await photoCells[0].boundingBox();
      if (box) await page.evaluate(({x, y}) => window.showTouch(x, y), { x: box.x + box.width/2, y: box.y + box.height/2 });
      await photoCells[0].click();
      await sleep(1800);

      // モーダルを閉じる
      await clickWithTouch(page, ".modal-close-icon-btn, .modal-close-btn", 800);
    }

    // ==========================================
    // シーン 7: 実績・あしあとモーダルの確認
    // ==========================================
    console.log("Scene 7: View Achievements / Milestones");
    await clickWithTouch(page, "button[aria-label='あしあと']", 1500);
    // モーダル内スクロール
    await page.mouse.wheel(0, 200);
    await sleep(1000);
    await clickWithTouch(page, ".modal-close-icon-btn", 800);

    // ==========================================
    // シーン 8: 週報画像生成 & シェアモーダル
    // ==========================================
    console.log("Scene 8: Share Modal / Weekly Report Generation");
    await clickWithTouch(page, "button[aria-label='シェア']", 2000);

    // アスペクト比の切り替え演出 (4:5 -> 9:16 -> 1:1)
    const ratioBtns = await page.$$(".segmented-btn");
    if (ratioBtns.length >= 3) {
      // 9:16 縦長
      const box1 = await ratioBtns[1].boundingBox();
      if (box1) await page.evaluate(({x, y}) => window.showTouch(x, y), { x: box1.x + box1.width/2, y: box1.y + box1.height/2 });
      await ratioBtns[1].click();
      await sleep(1600);

      // 1:1 正方形
      const box2 = await ratioBtns[2].boundingBox();
      if (box2) await page.evaluate(({x, y}) => window.showTouch(x, y), { x: box2.x + box2.width/2, y: box2.y + box2.height/2 });
      await ratioBtns[2].click();
      await sleep(1600);

      // 4:5 標準に戻す
      const box0 = await ratioBtns[0].boundingBox();
      if (box0) await page.evaluate(({x, y}) => window.showTouch(x, y), { x: box0.x + box0.width/2, y: box0.y + box0.height/2 });
      await ratioBtns[0].click();
      await sleep(1400);
    }

    await clickWithTouch(page, ".modal-close-icon-btn", 800);

    // ==========================================
    // シーン 9: カラーテーマの切り替え（設定）
    // ==========================================
    console.log("Scene 9: Theme Switch to Night Mode");
    await clickWithTouch(page, "button[aria-label='設定']", 1200);

    // ナイトモード選択
    const nightOption = await page.$(".theme-card-option:has-text('ナイト')");
    if (nightOption) {
      const box = await nightOption.boundingBox();
      if (box) await page.evaluate(({x, y}) => window.showTouch(x, y), { x: box.x + box.width/2, y: box.y + box.height/2 });
      await nightOption.click();
      await sleep(1400);
    }

    // 設定を閉じてナイトモードのグリッドを見せる
    await clickWithTouch(page, ".modal-close-icon-btn", 1000);

    // ナイトモードでグリッドをスクロール
    await page.mouse.wheel(0, 250);
    await sleep(900);
    await page.mouse.wheel(0, -250);
    await sleep(1500);

    console.log("All scenes recorded successfully!");
  } catch (err) {
    console.error("Recording error:", err);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    vite.kill();
  }

  // 生成された動画ファイルを所定の場所にコピー
  const files = fs.readdirSync(tempVideoDir).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const srcVideo = path.join(tempVideoDir, files[0]);
    const destVideo = path.join(OUTPUT_DIR, "demo_app.webm");
    const artifactVideo = path.join(ARTIFACT_DIR, "demo_app.webm");
    fs.copyFileSync(srcVideo, destVideo);
    fs.copyFileSync(srcVideo, artifactVideo);
    console.log(`\n🎉 Success! Demo video saved to:`);
    console.log(`- ${destVideo}`);
    console.log(`- ${artifactVideo}`);
  } else {
    console.log("No video file found in tmp directory.");
  }
}

main().catch(console.error);
