import { DayIndex, MealIndex, MealWithPhoto, WeekMeals } from "../../types";
import { StoredMealRecord } from "../interfaces";

export const DB_NAME = "mog_db";
export const DB_VERSION = 1;

export const STORES = {
  MEALS: "meals",
  IMAGES: "images",
  USER_PROFILE: "user_profile",
  CUSTOM_TAGS: "custom_tags",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * ブラウザのストレージ自動消去（Storage Eviction）を防止する
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Base64 DataURL を Blob に変換する
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch {
    return new Blob([], { type: "image/jpeg" });
  }
}

/**
 * Blob を DataURL に変換する
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to data URL"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * IndexedDB インスタンスのシングルトン取得とストア定義
 */
export function getMogDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    // 永続化を非同期でリクエスト
    requestPersistentStorage().catch(() => {});

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // 1. 食事レコードストア (1食1レコード)
      if (!db.objectStoreNames.contains(STORES.MEALS)) {
        const mealStore = db.createObjectStore(STORES.MEALS, { keyPath: "id" });
        mealStore.createIndex("by_week", "weekKey", { unique: false });
        mealStore.createIndex("by_recorded_at", "recordedAt", { unique: false });
        mealStore.createIndex("by_tags", "tags", { unique: false, multiEntry: true });
      }

      // 2. 画像Blobストア
      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        db.createObjectStore(STORES.IMAGES, { keyPath: "id" });
      }

      // 3. ユーザープロフィールストア
      if (!db.objectStoreNames.contains(STORES.USER_PROFILE)) {
        db.createObjectStore(STORES.USER_PROFILE, { keyPath: "id" });
      }

      // 4. カスタムタグストア
      if (!db.objectStoreNames.contains(STORES.CUSTOM_TAGS)) {
        db.createObjectStore(STORES.CUSTOM_TAGS, { keyPath: "tag" });
      }
    };

    request.onsuccess = async (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      // レガシーDB (ration_db) からの自動データ移行を実行
      try {
        await migrateFromLegacyDB(db);
      } catch (err) {
        console.warn("Legacy migration notice:", err);
      }
      resolve(db);
    };

    request.onerror = (e) => {
      dbPromise = null;
      reject((e.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

const MIGRATION_CHECK_KEY = "legacy_migration_completed_v1";

/**
 * 旧 IndexedDB (ration_db) のデータを安全に抽出し、新スキーマへ自動変換する
 */
async function migrateFromLegacyDB(targetDb: IDBDatabase): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  if (localStorage.getItem(MIGRATION_CHECK_KEY) === "true") return;

  const LEGACY_DB_NAME = "ration_db";
  const LEGACY_STORE_NAME = "meals_store";

  return new Promise((resolve) => {
    const checkReq = indexedDB.open(LEGACY_DB_NAME);
    let legacyExists = true;

    checkReq.onupgradeneeded = (e) => {
      // 存在しなかった場合は新規作成されてしまうためキャンセルしてクローズ
      legacyExists = false;
      const db = (e.target as IDBOpenDBRequest).result;
      db.close();
      indexedDB.deleteDatabase(LEGACY_DB_NAME);
    };

    checkReq.onsuccess = async (e) => {
      if (!legacyExists) {
        localStorage.setItem(MIGRATION_CHECK_KEY, "true");
        return resolve();
      }

      const legacyDb = (e.target as IDBOpenDBRequest).result;
      if (!legacyDb.objectStoreNames.contains(LEGACY_STORE_NAME)) {
        legacyDb.close();
        localStorage.setItem(MIGRATION_CHECK_KEY, "true");
        return resolve();
      }

      try {
        const tx = legacyDb.transaction(LEGACY_STORE_NAME, "readonly");
        const store = tx.objectStore(LEGACY_STORE_NAME);
        const cursorReq = store.openCursor();

        cursorReq.onsuccess = async (ev) => {
          const cursor = (ev.target as IDBRequest<IDBCursorWithValue>).result;
          if (!cursor) {
            legacyDb.close();
            localStorage.setItem(MIGRATION_CHECK_KEY, "true");
            return resolve();
          }

          const key = String(cursor.key);
          const val = cursor.value;

          try {
            if (key === "ration_user_profile" && val && typeof val === "object") {
              // プロフィールの移行
              const profileTx = targetDb.transaction(STORES.USER_PROFILE, "readwrite");
              const profileStore = profileTx.objectStore(STORES.USER_PROFILE);
              profileStore.put({
                id: "current_user",
                name: val.name || "USER",
                handle: val.handle || "",
                avatar: val.avatar || undefined,
                themePreference: val.themePreference || "ecru",
                supabaseUrl: val.supabaseUrl || "",
                supabaseKey: val.supabaseKey || "",
                updatedAt: Date.now(),
              });
            } else if (key === "ration_custom_tags" && Array.isArray(val)) {
              // タグマスタの移行
              const tagTx = targetDb.transaction(STORES.CUSTOM_TAGS, "readwrite");
              const tagStore = tagTx.objectStore(STORES.CUSTOM_TAGS);
              for (const tag of val) {
                if (typeof tag === "string" && tag.trim()) {
                  tagStore.put({ tag: tag.trim(), createdAt: Date.now(), useCount: 1 });
                }
              }
            } else if (key.startsWith("ration_meals_") && Array.isArray(val)) {
              // 1週間分食事データの正規化・移行
              const weekKey = key.replace("ration_meals_", "");
              const weekMeals = val as WeekMeals;

              const mealsTx = targetDb.transaction([STORES.MEALS, STORES.IMAGES], "readwrite");
              const mealsStore = mealsTx.objectStore(STORES.MEALS);
              const imagesStore = mealsTx.objectStore(STORES.IMAGES);

              for (let di = 0; di < weekMeals.length; di++) {
                const dayMeals = weekMeals[di];
                if (!Array.isArray(dayMeals)) continue;

                for (let mi = 0; mi < dayMeals.length; mi++) {
                  const meal = dayMeals[mi];
                  if (!meal) continue;

                  const recordId = `${weekKey}_${di}_${mi}`;
                  let imageId: string | undefined;

                  // 画像が含まれていれば images ストアへ分離退避
                  if ("image" in meal && meal.image && typeof meal.image === "string") {
                    imageId = `img_${recordId}`;
                    const blob = dataUrlToBlob(meal.image);
                    imagesStore.put({
                      id: imageId,
                      blob,
                      mimeType: blob.type || "image/jpeg",
                      createdAt: Date.now(),
                    });
                  }

                  const record: StoredMealRecord = {
                    id: recordId,
                    weekKey,
                    dayIndex: di as DayIndex,
                    mealIndex: mi as MealIndex,
                    recordedAt: new Date().toISOString(),
                    style: (meal as MealWithPhoto).style,
                    iconKey: (meal as MealWithPhoto).iconKey,
                    quickEmoji: (meal as MealWithPhoto).quickEmoji,
                    note: (meal as MealWithPhoto).note,
                    tags: (meal as MealWithPhoto).tags,
                    skipped: "skipped" in meal ? meal.skipped : undefined,
                    imageId,
                    updatedAt: Date.now(),
                    syncStatus: "synced",
                  };

                  mealsStore.put(record);
                }
              }
            }
          } catch (e) {
            console.error("Error migrating key:", key, e);
          }

          cursor.continue();
        };

        cursorReq.onerror = () => {
          legacyDb.close();
          resolve();
        };
      } catch {
        legacyDb.close();
        resolve();
      }
    };

    checkReq.onerror = () => {
      resolve();
    };
  });
}
