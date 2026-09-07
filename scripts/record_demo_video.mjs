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
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(43, 90, 83, 0.4);
        border: 2px solid rgba(43, 90, 83, 0.85);
        pointer-events: none;
        z-index: 9999999;
        transform: translate(-50%, -50%) scale(0.2);
        transition: transform 0.28s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.32s ease-out;
        box-shadow: 0 0 14px rgba(43, 90, 83, 0.45);
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

// 指定セレクタをタップ演出付きでクリック（自動スクロール対応）
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

// 要素直接クリック（自動スクロール対応＆タップ波紋付き）
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

// モーダルが完全に閉じるのを待つ
async function waitModalClosed(page) {
  await sleep(400);
  await page.waitForSelector(".modal-overlay", { state: "detached", timeout: 4000 }).catch(() => {});
  await sleep(350);
}

// モーダルを確実に閉じる
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

// 人間らしいタイピング（自動スクロール対応）
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
  console.log("=== Starting Comprehensive Monkey-Style Demo Recording ===");

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

  // モバイル端末（iPhone 15 Pro相当: 412x860, 高解像度 2x）
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

    // データベースを初期化してクリーンな初期状態からスタート
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

    // =========================================================================
    // シーン 1: 週移動ナビゲーションのモンキー探索（前週・次週・今週ジャンプ）
    // =========================================================================
    console.log("Scene 1: Interactive Week Navigation");
    await clickWithTouch(page, "button.week-nav-btn[aria-label='前の週']", 500);
    await clickWithTouch(page, "button.week-nav-btn[aria-label='前の週']", 600);
    await clickWithTouch(page, "button.btn-today-mini", 700);

    await clickWithTouch(page, "button.week-nav-btn[aria-label='次の週']", 500);
    await clickWithTouch(page, "button.btn-today-mini", 800);

    // 初期空グリッドを上下にスワイプ・スクロール
    await page.mouse.wheel(0, 200);
    await sleep(400);
    await page.mouse.wheel(0, -200);
    await sleep(600);

    // =========================================================================
    // シーン 2: ゼロ摩擦のワンタップ絵文字記録
    // =========================================================================
    console.log("Scene 2: Zero-Friction One-Tap Emoji Record");
    const emptyCells = await page.$$(".meal-cell-empty");
    if (emptyCells.length > 0) {
      await clickElement(page, emptyCells[0], 800);

      // クイック絵文字カード「自炊 🍳」をワンタップ記録！
      const quickCards = await page.$$(".quick-emoji-card");
      if (quickCards.length > 0) {
        await clickElement(page, quickCards[0], 600);
        await waitModalClosed(page);
      }
    }

    // =========================================================================
    // シーン 3: 詳細入力モードの探索（アコーディオン・タブ・タグ・メモ・タイピング）
    // =========================================================================
    console.log("Scene 3: Rich AddMealModal Exploration (Accordion, Tabs, Custom Tag, Typing)");
    const emptyCells2 = await page.$$(".meal-cell-empty");
    if (emptyCells2.length > 0) {
      await clickElement(page, emptyCells2[0], 800);

      // 「メモ・タグ・他の食事を追加」アコーディオンを展開
      const toggleDetailsBtn = await page.$(".btn-toggle-details");
      if (toggleDetailsBtn) {
        await clickElement(page, toggleDetailsBtn, 600);
      }

      // 展開された追加絵文字カテゴリタブを軽快に切り替え
      const tabNames = ["おかず・主菜", "おやつ・果物", "飲み物・カフェ", "主食・ごはん"];
      for (const tName of tabNames) {
        const tabEl = await page.$(`.emoji-tab-btn:has-text('${tName}')`);
        if (tabEl) {
          await clickElement(page, tabEl, 350);
        }
      }

      // ラーメンを選択
      const ramenItem = await page.$(".emoji-grid-item:has-text('ラーメン')");
      if (ramenItem) await clickElement(page, ramenItem, 400);

      // プリセットタグ「外食」を選択
      const tagOut = await page.$(".tag-chip:has-text('外食')");
      if (tagOut) await clickElement(page, tagOut, 300);

      // カスタムタグを入力して追加してみる
      await humanType(page, ".custom-tag-input", "特製", true);
      const addTagBtn = await page.$(".btn-add-custom-tag");
      if (addTagBtn) await clickElement(page, addTagBtn, 400);

      // メモを入力
      await humanType(page, ".modal-text-input", "濃厚味噌ラーメン味玉つき", true);

      // 保存する -> トースト通知が表示される
      await clickWithTouch(page, ".btn-modal-primary", 800);
      await waitModalClosed(page);
    }

    // =========================================================================
    // シーン 4: 休食（スキップ）記録
    // =========================================================================
    console.log("Scene 4: Record Skip Meal");
    const emptyCells3 = await page.$$(".meal-cell-empty");
    if (emptyCells3.length > 0) {
      await clickElement(page, emptyCells3[0], 700);

      // 休食（スキップ）ボタンをタップ
      await clickWithTouch(page, ".hero-skip-btn", 800);
      await waitModalClosed(page);
    }

    // 休食セル（— おやすみ）をタップして詳細確認し、閉じる
    const restedCell = await page.$(".meal-cell.meal-cell-rested");
    if (restedCell) {
      await clickElement(page, restedCell, 1200);
      await closeModal(page);
    }

    // =========================================================================
    // シーン 5: 下部FABカメラボタンからのクイック記録
    // =========================================================================
    console.log("Scene 5: Bottom Camera FAB Quick Add");
    await clickWithTouch(page, ".nav-primary-btn", 900);

    // クイック絵文字「🍙 コンビニ」をワンタップ記録
    const quickCards2 = await page.$$(".quick-emoji-card");
    if (quickCards2.length > 1) {
      await clickElement(page, quickCards2[1], 600);
      await waitModalClosed(page);
    } else {
      await closeModal(page);
    }

    // =========================================================================
    // シーン 6: 登録済みセルのインライン編集（メモ・タグ書き換え）
    // =========================================================================
    console.log("Scene 6: Inline Edit Meal Details");
    const emojiCells = await page.$$(".meal-cell.meal-cell-emoji");
    if (emojiCells.length > 0) {
      // 登録セルを開く
      await clickElement(page, emojiCells[0], 1000);

      // 「メモやタグを編集する」ボタンをタップ
      const editBtn = await page.$(".btn-detail-edit");
      if (editBtn) {
        await clickElement(page, editBtn, 600);

        // メモを書き換える
        await humanType(page, "textarea.modal-textarea", "サクサクのバタートースト", true);

        // 保存する
        await clickWithTouch(page, "button.btn-modal-primary:has-text('保存する')", 1000);
      }

      await closeModal(page);
    }

    // =========================================================================
    // シーン 7: 1週間分のフルデータ投入 ＆ 活発なグリッドスクロール
    // =========================================================================
    console.log("Scene 7: Populate Full Week and Smooth Scroll");
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

      const fullWeek = [
        // 月
        [
          { quickEmoji: "🍞", note: "サクサクのバタートースト", tags: ["自炊"] },
          { quickEmoji: "🍜", note: "濃厚味噌ラーメン味玉つき", tags: ["外食", "特製"] },
          { image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80", note: "自炊ステーキとガーリックライス", tags: ["自炊"] }
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
          { image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80", note: "友達とデリバリーピザ", tags: ["テイクアウト"] }
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
          { image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80", note: "金曜ご褒美バーガー", tags: ["外食"] },
          { quickEmoji: "🍣", note: "回転寿司10皿！", tags: ["外食"] }
        ],
        // 土
        [
          { image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80", note: "休日のふわふわパンケーキ", tags: ["自炊"] },
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
    await sleep(1000);

    // 1週間の満たされたグリッドを軽快にスクロール探索
    await page.mouse.wheel(0, 300);
    await sleep(600);
    await page.mouse.wheel(0, 350);
    await sleep(700);
    await page.mouse.wheel(0, -400);
    await sleep(600);
    await page.mouse.wheel(0, -250);
    await sleep(800);

    // 写真付きセルをタップしてポラロイド詳細モーダルを開く
    console.log("Scene 7b: View Photo Meal Polaroid Detail");
    const photoCell = await page.$(".meal-cell.meal-cell-filled");
    if (photoCell) {
      await clickElement(page, photoCell, 1800);
      await closeModal(page);
    }

    // =========================================================================
    // シーン 8: 振り返り・実績モーダルのじっくり探索
    // =========================================================================
    console.log("Scene 8: Explore Achievements and Progress");
    await clickWithTouch(page, "button[aria-label='振り返り'], .nav-item:has-text('振り返り')", 1400);

    // 実績カード一覧をスクロールして見せる
    await page.mouse.wheel(0, 240);
    await sleep(800);
    await page.mouse.wheel(0, 240);
    await sleep(800);
    await page.mouse.wheel(0, -480);
    await sleep(900);
    await closeModal(page);

    // =========================================================================
    // シーン 9: 週報シェアモーダルのリッチ操作（比率切り替え・コメント編集・ズーム）
    // =========================================================================
    console.log("Scene 9: Share Modal Interaction (Ratio, Custom Comment, Zoom)");
    await clickWithTouch(page, "button[aria-label='シェア'], .nav-item:has-text('シェア')", 2200);

    // アスペクト比を切り替えてレイアウトの変化を見せる
    const ratio916 = await page.$(".segmented-btn:has-text('9:16')");
    if (ratio916) await clickElement(page, ratio916, 1500);

    const ratio11 = await page.$(".segmented-btn:has-text('1:1')");
    if (ratio11) await clickElement(page, ratio11, 1500);

    const ratio45 = await page.$(".segmented-btn:has-text('4:5')");
    if (ratio45) await clickElement(page, ratio45, 1200);

    // モーダルを少し下へスクロール
    const shareModalContent = await page.$(".share-modal-content");
    if (shareModalContent) {
      await shareModalContent.evaluate((el) => el.scrollTo({ top: 160, behavior: "smooth" }));
      await sleep(400);
    }

    // 週報コメントをタイピングで編集してみる（Canvasが再生成される）
    await humanType(page, "textarea.modal-textarea", "今週も美味しく自炊多めで乗り切った！", true);
    await sleep(1500);

    // 画像プレビューをタップして拡大（ズーム）
    const previewWrapper = await page.$(".share-preview-wrapper");
    if (previewWrapper) {
      await clickElement(page, previewWrapper, 1200);
      // もう一度タップしてズーム解除
      await clickElement(page, previewWrapper, 900);
    }

    await closeModal(page);

    // =========================================================================
    // シーン 10: 設定でのプロフィール編集＆ナイトモードへの切り替え
    // =========================================================================
    console.log("Scene 10: Settings Customization & Night Mode");
    await clickWithTouch(page, "button[aria-label='設定'], .nav-item:has-text('設定')", 1200);

    // お名前を変更
    await humanType(page, ".modal-text-input", "りょうへい", true);
    await sleep(500);

    // ナイトモードに切り替え
    const nightOption = await page.$(".theme-card-option:has-text('ナイト')");
    if (nightOption) await clickElement(page, nightOption, 1200);

    await closeModal(page);

    // ナイトモードでの美しいダークUIをスクロール探索
    console.log("Scene 11: Night Mode Smooth Navigation");
    await page.mouse.wheel(0, 260);
    await sleep(700);
    await page.mouse.wheel(0, -260);
    await sleep(800);

    // ナイトモード下で下部FABカメラボタンを押してみる
    await clickWithTouch(page, ".nav-primary-btn", 1000);
    await closeModal(page);

    // もう一度設定を開いて「生成り（エクリュ）」に戻してあたたかみのある画面を提示
    await clickWithTouch(page, "button[aria-label='設定'], .nav-item:has-text('設定')", 900);
    const ecruOption = await page.$(".theme-card-option:has-text('生成り')");
    if (ecruOption) await clickElement(page, ecruOption, 1000);
    await closeModal(page);

    // 最終シーン: 余韻とグリッド全体ビュー
    console.log("Final Scene: Overview & Completion");
    await sleep(1500);

    console.log("All comprehensive monkey-style scenes finished successfully!");
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
    console.log(`\n🎉 Success! Comprehensive demo video saved to:`);
    console.log(`- ${destVideo}`);
    console.log(`- ${artifactVideo}`);
  } else {
    console.log("No video file found in tmp directory.");
  }
}

main().catch(console.error);
