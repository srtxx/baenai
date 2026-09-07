import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9222;
const VITE_PORT = 4173;
const ARTIFACT_DIR = "/Users/suganuma_ryohei/.gemini/antigravity/brain/5d766754-f676-4e91-8ed2-5a60d8558544/screenshots";
const DOCS_DIR = path.resolve(process.cwd(), "docs/screenshots");

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            cb.reject(new Error(JSON.stringify(msg.error)));
          } else {
            cb.resolve(msg.result);
          }
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error("Eval error: " + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async captureScreenshot(filename) {
    const res = await this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const buffer = Buffer.from(res.data, "base64");
    fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buffer);
    fs.writeFileSync(path.join(DOCS_DIR, filename), buffer);
    console.log(`Saved screenshot: ${filename}`);
  }
}

async function main() {
  console.log("Building app...");
  // Launch vite preview server
  console.log("Starting preview server...");
  const vite = spawn("npx", ["vite", "preview", "--port", String(VITE_PORT)], {
    stdio: "pipe",
  });

  // Launch Chrome headless
  const chromeDataDir = `/tmp/chrome-capture-${Date.now()}`;
  console.log("Starting Chrome headless...");
  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${chromeDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--window-size=430,932",
    ],
    { stdio: "pipe" }
  );

  try {
    await sleep(2000);

    // Get websocket URL for page
    const versionInfo = await getJson(`http://localhost:${PORT}/json/version`);
    console.log("Chrome CDP ready:", versionInfo["Browser"]);

    // Create new target / page
    const targets = await getJson(`http://localhost:${PORT}/json/list`);
    let pageTarget = targets.find((t) => t.type === "page");
    if (!pageTarget) {
      pageTarget = await getJson(`http://localhost:${PORT}/json/new`);
    }

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    console.log("Connected to CDP!");

    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");

    // Set mobile device emulation (iPhone 15 Pro style: 430 x 932, scale 2)
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 430,
      height: 932,
      deviceScaleFactor: 2,
      mobile: true,
    });

    const targetUrl = `http://localhost:${VITE_PORT}`;
    console.log(`Navigating to ${targetUrl}...`);
    await cdp.send("Page.navigate", { url: targetUrl });
    await sleep(1500);

    // 1. Capture Empty Main Screen
    await cdp.captureScreenshot("01_main_weekly_grid_empty.png");

    // Setup Mock Data in IndexedDB and LocalStorage
    console.log("Injecting mock meal data...");
    await cdp.eval(`
      (async () => {
        // Mock profile
        localStorage.setItem("ration_user_profile", JSON.stringify({
          name: "あおば",
          themePreference: "ecru"
        }));

        // Mock reflections
        const reflections = [
          { id: "first_meal", title: "はじめの一歩", description: "最初の食事を記録した", icon: "🌱", unlocked: true, unlockedAt: "2026/09/01" },
          { id: "three_meals", title: "三食のめぐみ", description: "1日で朝・昼・夜の3食すべてを記録した", icon: "🍱", unlocked: true, unlockedAt: "2026/09/02" },
          { id: "home_cook", title: "つくるよろこび", description: "1週間に5食以上自炊で記録した", icon: "🍳", unlocked: true, unlockedAt: "2026/09/04" },
          { id: "rest_kindness", title: "無理しない勇気", description: "おやすみを3回以上記録した", icon: "🌙", unlocked: true, unlockedAt: "2026/09/05" },
          { id: "weekly_record", title: "一週間のmog", description: "1週間のうち15食以上を記録した", icon: "📓", unlocked: true, unlockedAt: "2026/09/07" },
          { id: "share_week", title: "今週のふりかえり", description: "週報画像を生成・保存した", icon: "🖼", unlocked: false, progress: { current: 0, max: 1 } },
          { id: "all_week_logged", title: "満ち足りた一週間", description: "1週間の全21マスを記録またはおやすみで埋めた", icon: "✨", unlocked: false, progress: { current: 16, max: 21 } }
        ];
        localStorage.setItem("mog_reflections_v2", JSON.stringify(reflections));

        // SVG sample image helper
        const makeSampleImage = (bg, emoji, label) => {
          const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
            '<rect width="400" height="300" fill="' + bg + '"/>' +
            '<circle cx="200" cy="130" r="70" fill="rgba(255,255,255,0.25)"/>' +
            '<text x="200" y="150" font-size="72" text-anchor="middle">' + emoji + '</text>' +
            '<text x="200" y="240" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">' + label + '</text>' +
            '</svg>';
          return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        };

        const imgSalad = makeSampleImage("#609966", "🥗", "自家製グリーンサラダ");
        const imgCurry = makeSampleImage("#D48166", "🍛", "手作りチキンカレー");
        const imgRamen = makeSampleImage("#C58940", "🍜", "近所の醤油ラーメン");
        const imgToast = makeSampleImage("#E5BA73", "🍞", "バタートーストと珈琲");
        const imgPasta = makeSampleImage("#D07A60", "🍝", "和風きのこパスタ");
        const imgSushi = makeSampleImage("#5A8F7B", "🍣", "スーパーのお寿司");
        const imgNabe  = makeSampleImage("#8E7F6B", "🍲", "野菜たっぷり寄せ鍋");

        // 7 days x 3 meals
        const mockMeals = [
          // 月
          [
            { image: imgToast, note: "トーストと目玉焼き、温かいブラックコーヒー", tags: ["自炊"] },
            { image: imgSalad, note: "コンビニのチキンサラダと玄米おにぎり", tags: ["コンビニ"] },
            { image: imgCurry, note: "作り置きのスパイスチキンカレー。味が馴染んで美味しい", tags: ["自炊"] }
          ],
          // 火
          [
            { quickEmoji: "🍌", note: "バナナと豆乳ヨーグルト", tags: ["自炊"] },
            { image: imgPasta, note: "きのこたっぷり和風パスタ", tags: ["自炊"] },
            { skipped: true }
          ],
          // 水
          [
            { image: imgToast, note: "全粒粉パンとカフェオレ", tags: ["自炊"] },
            { image: imgRamen, note: "同僚とランチで中華そば", tags: ["外食"] },
            { image: imgNabe, note: "冷えるので白菜と豚肉の小鍋", tags: ["自炊"] }
          ],
          // 木
          [
            { quickEmoji: "🍙", note: "梅おにぎりと緑茶", tags: ["自炊"] },
            { quickEmoji: "🥪", note: "たまごサンド", tags: ["コンビニ"] },
            { image: imgCurry, note: "カレーの残りにチーズを乗せて焼きカレー", tags: ["自炊"] }
          ],
          // 金
          [
            { skipped: true },
            { image: imgPasta, note: "明太子パスタ", tags: ["外食"] },
            { image: imgSushi, note: "金曜のご褒美に半額のお寿司", tags: ["テイクアウト"] }
          ],
          // 土
          [
            { image: imgToast, note: "のんびり起きてフレンチトースト", tags: ["自炊"] },
            { quickEmoji: "🍔", note: "テイクアウトのハンバーガー", tags: ["テイクアウト"] },
            null
          ],
          // 日
          [
            null,
            null,
            null
          ]
        ];

        // Save to IndexedDB
        const getMonday = (d = new Date()) => {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const mon = new Date(d.setDate(diff));
          mon.setHours(0, 0, 0, 0);
          return mon;
        };
        const curMon = getMonday();
        const y = curMon.getFullYear();
        const m = String(curMon.getMonth() + 1).padStart(2, "0");
        const day = String(curMon.getDate()).padStart(2, "0");
        const weekKey = y + "_" + m + "_" + day;

        // Open IndexedDB
        return new Promise((resolve, reject) => {
          const req = indexedDB.open("ration_db", 1);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("meals_store")) {
              db.createObjectStore("meals_store");
            }
          };
          req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction("meals_store", "readwrite");
            const store = tx.objectStore("meals_store");
            store.put(mockMeals, "ration_meals_" + weekKey);
            store.put({ name: "あおば", themePreference: "ecru", avatar: "" }, "ration_user_profile");
            tx.oncomplete = () => resolve("OK");
            tx.onerror = () => reject(tx.error);
          };
        });
      })()
    `);

    // Reload page to reflect data
    console.log("Reloading with mock data...");
    await cdp.send("Page.reload");
    await sleep(1500);

    // 2. Capture Filled Main Weekly Grid (Ecru theme)
    await cdp.captureScreenshot("02_main_weekly_grid_ecru.png");

    // 3. Open Add Meal Modal (Quick Emoji / Photo selection)
    await cdp.eval(`document.querySelector('.meal-grid .day-row:nth-child(6) .meal-cell-empty')?.click()`);
    await sleep(600);
    await cdp.captureScreenshot("03_modal_add_meal_quick.png");

    // 4. Expand Note / Tag Section in Add Meal Modal
    await cdp.eval(`document.querySelector('.btn-toggle-details')?.click()`);
    await sleep(400);
    await cdp.captureScreenshot("04_modal_add_meal_note.png");

    // Close Modal
    await cdp.eval(`document.querySelector('.modal-close-icon-btn')?.click()`);
    await sleep(400);

    // 5. Open Detail Modal for Photo Meal (Monday Dinner)
    await cdp.eval(`document.querySelector('.meal-grid .day-row:nth-child(1) .meal-cell-filled:nth-of-type(3)')?.click() || document.querySelector('.meal-cell-filled')?.click()`);
    await sleep(600);
    await cdp.captureScreenshot("05_modal_meal_detail_photo.png");

    // 6. Click Edit button in Detail Modal
    await cdp.eval(`document.querySelector('.btn-detail-edit')?.click()`);
    await sleep(400);
    await cdp.captureScreenshot("06_modal_meal_detail_edit.png");

    // Close Modal
    await cdp.eval(`document.querySelector('.modal-close-icon-btn')?.click()`);
    await sleep(400);

    // 7. Open Detail Modal for Emoji Meal (Tuesday Breakfast)
    await cdp.eval(`document.querySelector('.meal-cell-emoji')?.click()`);
    await sleep(600);
    await cdp.captureScreenshot("07_modal_meal_detail_emoji.png");

    // Close Modal
    await cdp.eval(`document.querySelector('.modal-close-icon-btn')?.click()`);
    await sleep(400);

    // 8. Open Detail Modal for Skipped Meal (Tuesday Dinner)
    await cdp.eval(`document.querySelector('.meal-cell-rested')?.click()`);
    await sleep(600);
    await cdp.captureScreenshot("08_modal_meal_detail_skipped.png");

    // Close Modal
    await cdp.eval(`document.querySelector('.btn-cancel')?.click() || document.querySelector('.modal-overlay')?.click()`);
    await sleep(400);

    // 9. Open Share Modal (Generate canvas image)
    await cdp.eval(`document.querySelector('.share-btn')?.click()`);
    await sleep(2000); // Wait for canvas share image generation
    await cdp.captureScreenshot("09_modal_share_preview.png");

    // Click preview to test Zoom Lightbox
    await cdp.eval(`document.querySelector('.share-preview-wrapper')?.click()`);
    await sleep(400);
    await cdp.captureScreenshot("09_modal_share_zoom_lightbox.png");
    await cdp.eval(`document.querySelector('.lightbox-close-btn')?.click()`);
    await sleep(400);

    // Switch ratio to 9:16
    await cdp.eval(`Array.from(document.querySelectorAll('.segmented-btn')).find(b => b.textContent.includes('9:16'))?.click()`);
    await sleep(1500);
    await cdp.captureScreenshot("10_modal_share_story_9_16.png");

    // Close Share Modal
    await cdp.eval(`document.querySelector('.modal-close-icon-btn')?.click()`);
    await sleep(400);

    // 11. Open Achievements Modal
    await cdp.eval(`document.querySelector('.btn-header-action[title*="ふりかえり"]')?.click()`);
    await sleep(600);
    await cdp.captureScreenshot("11_modal_achievements.png");

    // Close Achievements Modal
    await cdp.eval(`document.querySelector('.modal-close-icon-btn')?.click()`);
    await sleep(400);

    // 12. Open Settings Modal (via bottom nav)
    await cdp.eval(`document.querySelector('.nav-item[title*="設定"]')?.click()`);
    await sleep(600);
    await cdp.captureScreenshot("12_modal_settings.png");

    // Switch theme to Night in settings
    await cdp.eval(`document.querySelector('.theme-card-option:nth-child(2)')?.click()`);
    await sleep(500);
    await cdp.captureScreenshot("13_modal_settings_night.png");

    // Close Settings Modal
    await cdp.eval(`document.querySelector('.settings-modal-content .modal-close-icon-btn')?.click()`);
    await sleep(500);

    // 14. Main Grid in Night Mode
    await cdp.captureScreenshot("14_main_weekly_grid_night.png");

    console.log("All screenshots captured successfully!");
  } catch (err) {
    console.error("Error during capture:", err);
  } finally {
    vite.kill();
    chrome.kill();
    try {
      fs.rmSync(chromeDataDir, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }
}

main();
