import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 5299;
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
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(91, 130, 102, 0.4);
        border: 2px solid rgba(91, 130, 102, 0.85);
        pointer-events: none;
        z-index: 9999999;
        transform: translate(-50%, -50%) scale(0.2);
        transition: transform 0.28s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.32s ease-out;
        box-shadow: 0 0 14px rgba(91, 130, 102, 0.45);
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

// 人間らしいタイピング
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
  console.log("=== Starting Full UI Demo Video Recording (Desktop Full Scope) ===");

  console.log("Launching Vite server on port " + PORT + "...");
  const vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });

  await sleep(2000);

  const tempVideoDir = path.resolve(ROOT_DIR, "tmp_recordings/full_ui");
  if (fs.existsSync(tempVideoDir)) {
    fs.rmSync(tempVideoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempVideoDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
  });

  // UI全体（Webデスクトップ画面全体: 1280 x 820）
  const context = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: tempVideoDir,
      size: { width: 1280, height: 820 },
    },
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to app...");
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
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

    await page.reload({ waitUntil: "domcontentloaded" });
    await injectTouchIndicator(page);
    await sleep(1000);

    // =========================================================================
    // シーン 1: 週ナビゲーション（前週・次週・今週ジャンプ）
    // =========================================================================
    console.log("Scene 1: Interactive Week Navigation");
    await clickWithTouch(page, "button.week-nav-btn[aria-label='前の週']", 700);
    await clickWithTouch(page, "button.week-nav-btn[aria-label='前の週']", 700);
    await clickWithTouch(page, "button.btn-today-mini", 800);

    await clickWithTouch(page, "button.week-nav-btn[aria-label='次の週']", 600);
    await clickWithTouch(page, "button.btn-today-mini", 900);

    // =========================================================================
    // シーン 2: ゼロ摩擦ワンタップ記録（クイック自炊記録 ＆ Toastクイックタグ）
    // =========================================================================
    console.log("Scene 2: Zero-Friction One-Tap Record & Toast Quick Tag");
    const emptyCells = await page.$$(".meal-cell-empty");
    if (emptyCells.length > 0) {
      await clickElement(page, emptyCells[0], 800);

      // クイック選択肢「自炊」をワンタップ記録
      const quickCards = await page.$$(".quick-emoji-card");
      if (quickCards.length > 0) {
        await clickElement(page, quickCards[0], 700);
        await waitModalClosed(page);
      }

      // 出現したToastから「#自炊」タグをワンタップ付与
      await sleep(300);
      const toastTag = await page.$(".toast-tag-chip:has-text('#自炊')");
      if (toastTag) {
        await clickElement(page, toastTag, 800);
      }
    }

    // =========================================================================
    // シーン 3: 詳細入力モードの探索（アコーディオン・タグ・カスタムタグ・メモ）
    // =========================================================================
    console.log("Scene 3: Rich AddMealModal Exploration (Accordion, Custom Tag, Note Typing)");
    const emptyCells2 = await page.$$(".meal-cell-empty");
    if (emptyCells2.length > 1) {
      await clickElement(page, emptyCells2[1], 800);

      // 「ひとことメモやタグを添えて記録する」アコーディオンを展開
      const toggleDetailsBtn = await page.$(".btn-toggle-details");
      if (toggleDetailsBtn) {
        await clickElement(page, toggleDetailsBtn, 600);
      }

      // クイック選択肢から「外食」を選択
      const outCard = await page.$(".quick-emoji-card:has-text('外食')");
      if (outCard) await clickElement(page, outCard, 400);

      // プリセットタグ「ガッツリ」を選択
      const tagHearty = await page.$(".tag-chip:has-text('ガッツリ')");
      if (tagHearty) await clickElement(page, tagHearty, 400);

      // カスタムタグ「特製」を追加
      await humanType(page, ".custom-tag-input", "特製", true);
      const addTagBtn = await page.$(".btn-add-custom-tag");
      if (addTagBtn) await clickElement(page, addTagBtn, 400);

      // ひとことメモをタイピング
      await humanType(page, ".modal-note-input", "濃厚味噌ラーメン味玉つき", true);
      await sleep(500);

      // 保存する
      await clickWithTouch(page, ".btn-modal-primary", 800);
      await waitModalClosed(page);
    }

    // =========================================================================
    // シーン 4: 休食（体を休める）記録
    // =========================================================================
    console.log("Scene 4: Record Rest/Skip Meal");
    const emptyCells3 = await page.$$(".meal-cell-empty");
    if (emptyCells3.length > 2) {
      await clickElement(page, emptyCells3[2], 700);

      // 休食ボタンをタップ
      await clickWithTouch(page, ".hero-skip-btn", 800);
      await waitModalClosed(page);
    }

    // 休食セル（— 休食）をタップして詳細確認
    const restedCell = await page.$(".meal-cell.meal-cell-rested");
    if (restedCell) {
      await clickElement(page, restedCell, 1200);
      await closeModal(page);
    }

    // =========================================================================
    // シーン 5: 下部FABカメラボタンからのクイック記録
    // =========================================================================
    console.log("Scene 5: Bottom FAB Quick Add & Toast Memo Inline Edit");
    await clickWithTouch(page, ".nav-primary-btn", 900);

    const storeCard = await page.$(".quick-emoji-card:has-text('コンビニ')");
    if (storeCard) {
      await clickElement(page, storeCard, 700);
      await waitModalClosed(page);

      // Toastの「メモを追加」から追記
      const toastActionBtn = await page.$(".toast-action-btn");
      if (toastActionBtn) {
        await clickElement(page, toastActionBtn, 700);
        await humanType(page, "textarea.modal-textarea", "ツナマヨおにぎりと温かいお茶", true);
        await clickWithTouch(page, "button.btn-modal-primary:has-text('保存する')", 800);
        await waitModalClosed(page);
      }
    } else {
      await closeModal(page);
    }

    // =========================================================================
    // シーン 6: 登録済みセルのインライン編集（タグ＋メモ同時表示の実証）
    // =========================================================================
    console.log("Scene 6: Inline Edit Meal Details & Simultaneous Tag+Note View");
    const emojiCells = await page.$$(".meal-cell.meal-cell-emoji");
    if (emojiCells.length > 0) {
      await clickElement(page, emojiCells[0], 1000);

      const editBtn = await page.$(".btn-detail-edit");
      if (editBtn) {
        await clickElement(page, editBtn, 600);
        await humanType(page, "textarea.modal-textarea", "サクサクのバタートーストと珈琲", true);
        await clickWithTouch(page, "button.btn-modal-primary:has-text('保存する')", 900);
      }
      await closeModal(page);
    }

    // =========================================================================
    // シーン 7: 1週間分の充実したデータ反映（写真・タグ・メモ満載グリッド）
    // =========================================================================
    console.log("Scene 7: Populate Full Week of Balanced Real-Life Meals");
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

      // SVGベースの軽量かつ美麗な料理サンプル画像
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
        // 月
        [
          { style: "cook", iconKey: "pan", note: "サクサクのバタートースト", tags: ["自炊"] },
          { style: "out", iconKey: "utensils", note: "濃厚味噌ラーメン味玉つき", tags: ["外食", "特製"] },
          { image: imgSteak, note: "自炊ステーキとガーリックライス", tags: ["自炊", "ガッツリ"] }
        ],
        // 火
        [
          { skipped: true },
          { style: "store", iconKey: "store", note: "コンビニ唐揚げ弁当", tags: ["コンビニ"] },
          { style: "cook", iconKey: "pan", note: "手作りスパイスチキンカレー", tags: ["自炊"] }
        ],
        // 水
        [
          { style: "cook", iconKey: "pan", note: "鮭おにぎりと温かい緑茶", tags: ["自炊", "ヘルシー"] },
          { style: "cafe", iconKey: "coffee", note: "BLTサンドとアイスラテ", tags: ["カフェ"] },
          { image: imgPizza, note: "友達とデリバリーピザパーティー", tags: ["テイクアウト", "飲み会"] }
        ],
        // 木
        [
          { style: "cook", iconKey: "pan", note: "オートミールとヨーグルト", tags: ["自炊", "ヘルシー"] },
          { style: "store", iconKey: "store", note: "ヘルシーサラダチキン", tags: ["コンビニ", "ヘルシー"] },
          { style: "out", iconKey: "utensils", note: "同僚と居酒屋焼き鳥盛り合わせ", tags: ["外食", "飲み会"] }
        ],
        // 金
        [
          { style: "cafe", iconKey: "coffee", note: "朝の淹れたて深煎りコーヒー", tags: ["カフェ"] },
          { image: imgBurger, note: "金曜ご褒美の肉厚チーズバーガー", tags: ["外食", "ガッツリ"] },
          { style: "out", iconKey: "utensils", note: "回転寿司10皿満喫", tags: ["外食"] }
        ],
        // 土
        [
          { image: imgPancake, note: "休日の手作りふわふわパンケーキ", tags: ["自炊"] },
          { style: "cook", iconKey: "pan", note: "生ハムとフレッシュトマトのパスタ", tags: ["自炊"] },
          { style: "cook", iconKey: "pan", note: "旬の野菜たっぷり寄せ鍋", tags: ["自炊", "ヘルシー"] }
        ],
        // 日
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

    // =========================================================================
    // シーン 8: 写真付きセルのポラロイド詳細ビュー鑑賞
    // =========================================================================
    console.log("Scene 8: Polaroid Photo Meal Detail");
    const photoCell = await page.$(".meal-cell.meal-cell-filled");
    if (photoCell) {
      await clickElement(page, photoCell, 1800);
      await closeModal(page);
    }

    // =========================================================================
    // シーン 9: 生活リズム（振り返り・実績）モーダルの確認
    // =========================================================================
    console.log("Scene 9: Life Rhythm & Achievements Exploration");
    await clickWithTouch(page, "button[aria-label='生活リズム'], .nav-item:has-text('生活リズム')", 1400);
    await sleep(1000);
    await closeModal(page);

    // =========================================================================
    // シーン 10: 週末の生存報告カード ＆ 生存報告シェアモーダル（比率切替・コメント・ズーム）
    // =========================================================================
    console.log("Scene 10: Weekend Survival Card & Share Modal Rich Interaction");
    const survivalCard = await page.$(".weekend-survival-card");
    if (survivalCard) {
      await clickElement(page, survivalCard, 2200);
    } else {
      await clickWithTouch(page, "button[aria-label='生存報告'], .nav-item:has-text('生存報告')", 2200);
    }

    // アスペクト比を切り替えてレイアウトの変化を見せる（Canvas再生成）
    const ratio916 = await page.$(".segmented-btn:has-text('9:16')");
    if (ratio916) await clickElement(page, ratio916, 1400);

    const ratio11 = await page.$(".segmented-btn:has-text('1:1')");
    if (ratio11) await clickElement(page, ratio11, 1400);

    const ratio45 = await page.$(".segmented-btn:has-text('4:5')");
    if (ratio45) await clickElement(page, ratio45, 1200);

    // 生存報告のひとことコメントをプリセットから変更
    const presetChip = await page.$(".share-preset-chips button:has-text('無事に一週間を乗り切った！')");
    if (presetChip) {
      await clickElement(page, presetChip, 1200);
    }

    // 画像プレビューをタップして高精細ズーム鑑賞
    const previewWrapper = await page.$(".share-preview-wrapper");
    if (previewWrapper) {
      await clickElement(page, previewWrapper, 1600);
      const lightboxClose = await page.$(".lightbox-close-btn");
      if (lightboxClose) {
        await clickElement(page, lightboxClose, 800);
      } else {
        await page.keyboard.press("Escape");
        await sleep(800);
      }
    }

    await closeModal(page);

    // =========================================================================
    // シーン 11: 設定モーダルでのユーザー名変更 ＆ ナイトモード切り替え
    // =========================================================================
    console.log("Scene 11: Settings Profile & Night Mode Dynamic Shift");
    await clickWithTouch(page, "button[aria-label='設定'], .nav-item:has-text('設定')", 1200);

    // お名前を入力
    await humanType(page, ".modal-text-input", "りょうへい", true);
    await sleep(600);

    // ナイトモードに切り替え！
    const nightOption = await page.$(".theme-card-option:has-text('ナイト')");
    if (nightOption) await clickElement(page, nightOption, 1400);

    await closeModal(page);

    // ナイトモードでのWeb UI全体の美しいコントラストをじっくり鑑賞
    console.log("Scene 12: Night Mode Full UI Appreciation");
    await sleep(2000);

    // ナイトモード下で下部FABカメラボタンを押してモーダルを確認
    await clickWithTouch(page, ".nav-primary-btn", 1100);
    await closeModal(page);

    // 再度設定を開いて「生成り（エクリュ）」に戻してあたたかみのある全体UIを提示
    await clickWithTouch(page, "button[aria-label='設定'], .nav-item:has-text('設定')", 1000);
    const ecruOption = await page.$(".theme-card-option:has-text('生成り')");
    if (ecruOption) await clickElement(page, ecruOption, 1200);
    await closeModal(page);

    // 最終シーン: 余韻と全体ビュー
    console.log("Final Scene: Overview & Completion");
    await sleep(2200);

    console.log("All Full UI demo scenes recorded successfully!");
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
    const fullUiDestVideo = path.join(OUTPUT_DIR, "demo_app_full_ui.webm");
    const artifactVideo = path.join(ARTIFACT_DIR, "demo_app.webm");
    const artifactFullUi = path.join(ARTIFACT_DIR, "demo_app_full_ui.webm");

    fs.copyFileSync(srcVideo, destVideo);
    fs.copyFileSync(srcVideo, fullUiDestVideo);
    fs.copyFileSync(srcVideo, artifactVideo);
    fs.copyFileSync(srcVideo, artifactFullUi);

    console.log("\nSuccess! Full UI Demo video saved to:");
    console.log(`- ${destVideo}`);
    console.log(`- ${fullUiDestVideo}`);
    console.log(`- ${artifactVideo}`);
  } else {
    console.log("No video file found in tmp directory.");
  }
}

main().catch(console.error);
