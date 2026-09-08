import { WeekMeals } from "./types";

const DB_NAME = "ration_db";
const STORE_NAME = "meals_store";

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const target = e.target as IDBOpenDBRequest;
      const db = target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => {
      const target = e.target as IDBOpenDBRequest;
      resolve(target.result);
    };
    request.onerror = (e) => {
      const target = e.target as IDBOpenDBRequest;
      reject(target.error);
    };
  });
}

export async function getSavedMeals(weekKey = "default"): Promise<WeekMeals | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(`ration_meals_${weekKey}`);
    request.onsuccess = () => resolve((request.result as WeekMeals) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMeals(weekKey = "default", meals: WeekMeals): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(meals, `ration_meals_${weekKey}`);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllMeals(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

const PROFILE_KEY = "ration_user_profile";
const CUSTOM_TAGS_KEY = "ration_custom_tags";

export async function getUserProfile(): Promise<import("./types").UserProfile> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(PROFILE_KEY);
      request.onsuccess = () => {
        const res = request.result;
        if (res && typeof res === "object" && "name" in res) {
          resolve(res as import("./types").UserProfile);
        } else {
          resolve({ name: "USER", handle: "" });
        }
      };
      request.onerror = () => resolve({ name: "USER", handle: "" });
    });
  } catch {
    return { name: "USER", handle: "" };
  }
}

export async function saveUserProfile(profile: import("./types").UserProfile): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(profile, PROFILE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCustomTags(): Promise<string[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CUSTOM_TAGS_KEY);
      request.onsuccess = async () => {
        const res = request.result;
        if (Array.isArray(res)) {
          resolve(res as string[]);
        } else {
          // 初回アクセス時、過去の保存済み食事データからタグを自動抽出してマスタを自己修復・初期化
          const extracted = await extractTagsFromStoredMeals(db);
          if (extracted.length > 0) {
            await saveCustomTags(extracted);
          }
          resolve(extracted);
        }
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveCustomTags(tags: string[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(tags, CUSTOM_TAGS_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function extractTagsFromStoredMeals(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();
      const tagsSet = new Set<string>();

      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const key = String(cursor.key);
          if (key.startsWith("ration_meals_") && Array.isArray(cursor.value)) {
            const weekMeals = cursor.value as WeekMeals;
            for (const day of weekMeals) {
              if (Array.isArray(day)) {
                for (const meal of day) {
                  if (meal && "tags" in meal && Array.isArray(meal.tags)) {
                    for (const t of meal.tags) {
                      if (typeof t === "string" && t.trim()) {
                        tagsSet.add(t.trim().replace(/^#+/, ""));
                      }
                    }
                  }
                }
              }
            }
          }
          cursor.continue();
        } else {
          resolve(Array.from(tagsSet));
        }
      };
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}



