import { DayIndex, MealIndex, UserProfile } from "../../types";
import {
  IMealRepository,
  IImageRepository,
  IProfileRepository,
  ITagRepository,
  StoredMealRecord,
  StoredImageRecord,
} from "../interfaces";
import { getMogDB, STORES } from "./database";

/**
 * 食事リポジトリの IndexedDB 実装
 */
export class IndexedDBMealRepository implements IMealRepository {
  async getMealsByWeek(weekKey: string): Promise<StoredMealRecord[]> {
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEALS, "readonly");
      const store = tx.objectStore(STORES.MEALS);
      const index = store.index("by_week");
      const request = index.getAll(weekKey);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getMeal(
    weekKey: string,
    dayIndex: DayIndex,
    mealIndex: MealIndex
  ): Promise<StoredMealRecord | null> {
    const db = await getMogDB();
    const id = `${weekKey}_${dayIndex}_${mealIndex}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEALS, "readonly");
      const store = tx.objectStore(STORES.MEALS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveMeal(record: StoredMealRecord): Promise<void> {
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEALS, "readwrite");
      const store = tx.objectStore(STORES.MEALS);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMeal(
    weekKey: string,
    dayIndex: DayIndex,
    mealIndex: MealIndex
  ): Promise<void> {
    const db = await getMogDB();
    const id = `${weekKey}_${dayIndex}_${mealIndex}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.MEALS, "readwrite");
      const store = tx.objectStore(STORES.MEALS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllMeals(): Promise<void> {
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.MEALS, STORES.IMAGES], "readwrite");
      const mealStore = tx.objectStore(STORES.MEALS);
      const imageStore = tx.objectStore(STORES.IMAGES);

      mealStore.clear();
      imageStore.clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllTags(): Promise<string[]> {
    const db = await getMogDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.MEALS, "readonly");
        const store = tx.objectStore(STORES.MEALS);
        const index = store.index("by_tags");
        const request = index.openKeyCursor();
        const tagsSet = new Set<string>();

        request.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursor>).result;
          if (cursor) {
            const tag = String(cursor.key);
            if (tag.trim()) tagsSet.add(tag.trim());
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
}

/**
 * 画像リポジトリの IndexedDB 実装（Blob分離ストレージ）
 */
export class IndexedDBImageRepository implements IImageRepository {
  private memoryCache = new Map<string, Blob>();

  async getImage(id: string): Promise<Blob | null> {
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id) || null;
    }

    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.IMAGES, "readonly");
      const store = tx.objectStore(STORES.IMAGES);
      const request = store.get(id);

      request.onsuccess = () => {
        const res = request.result as StoredImageRecord | undefined;
        if (res && res.blob) {
          this.memoryCache.set(id, res.blob);
          resolve(res.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveImage(id: string, blob: Blob, mimeType = "image/jpeg"): Promise<void> {
    this.memoryCache.set(id, blob);
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.IMAGES, "readwrite");
      const store = tx.objectStore(STORES.IMAGES);
      const record: StoredImageRecord = {
        id,
        blob,
        mimeType,
        createdAt: Date.now(),
      };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(id: string): Promise<void> {
    this.memoryCache.delete(id);
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.IMAGES, "readwrite");
      const store = tx.objectStore(STORES.IMAGES);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllImages(): Promise<void> {
    this.memoryCache.clear();
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.IMAGES, "readwrite");
      const store = tx.objectStore(STORES.IMAGES);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * プロフィールリポジトリの IndexedDB 実装
 */
export class IndexedDBProfileRepository implements IProfileRepository {
  private static readonly PROFILE_ID = "current_user";

  async getProfile(): Promise<UserProfile> {
    try {
      const db = await getMogDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.USER_PROFILE, "readonly");
        const store = tx.objectStore(STORES.USER_PROFILE);
        const request = store.get(IndexedDBProfileRepository.PROFILE_ID);

        request.onsuccess = () => {
          const res = request.result;
          if (res && typeof res === "object") {
            resolve({
              name: typeof res.name === "string" ? res.name : "USER",
              handle: res.handle || "",
              avatar: res.avatar,
              themePreference: res.themePreference || "ecru",
              supabaseUrl: res.supabaseUrl || "",
              supabaseKey: res.supabaseKey || "",
            });
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

  async saveProfile(profile: UserProfile): Promise<void> {
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USER_PROFILE, "readwrite");
      const store = tx.objectStore(STORES.USER_PROFILE);
      const record = {
        id: IndexedDBProfileRepository.PROFILE_ID,
        name: profile.name ?? "USER",
        handle: profile.handle ?? "",
        avatar: profile.avatar,
        themePreference: profile.themePreference || "ecru",
        supabaseUrl: profile.supabaseUrl ?? "",
        supabaseKey: profile.supabaseKey ?? "",
        updatedAt: Date.now(),
      };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * カスタムタグリポジトリの IndexedDB 実装
 */
export class IndexedDBTagRepository implements ITagRepository {
  async getTags(): Promise<string[]> {
    try {
      const db = await getMogDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.CUSTOM_TAGS, "readonly");
        const store = tx.objectStore(STORES.CUSTOM_TAGS);
        const request = store.getAll();

        request.onsuccess = () => {
          const records = (request.result || []) as { tag: string }[];
          resolve(records.map((r) => r.tag).filter(Boolean));
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async addTag(tag: string): Promise<void> {
    const cleanTag = tag.trim().replace(/^#+/, "");
    if (!cleanTag) return;
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CUSTOM_TAGS, "readwrite");
      const store = tx.objectStore(STORES.CUSTOM_TAGS);
      const request = store.put({ tag: cleanTag, createdAt: Date.now(), useCount: 1 });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeTag(tag: string): Promise<void> {
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CUSTOM_TAGS, "readwrite");
      const store = tx.objectStore(STORES.CUSTOM_TAGS);
      const request = store.delete(tag);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveTags(tags: string[]): Promise<void> {
    const db = await getMogDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CUSTOM_TAGS, "readwrite");
      const store = tx.objectStore(STORES.CUSTOM_TAGS);
      store.clear();
      for (const t of tags) {
        const clean = t.trim().replace(/^#+/, "");
        if (clean) {
          store.put({ tag: clean, createdAt: Date.now(), useCount: 1 });
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

// シングルトンインスタンスのエクスポート（将来の依存性注入/切り替えに対応）
export const mealRepository: IMealRepository = new IndexedDBMealRepository();
export const imageRepository: IImageRepository = new IndexedDBImageRepository();
export const profileRepository: IProfileRepository = new IndexedDBProfileRepository();
export const tagRepository: ITagRepository = new IndexedDBTagRepository();
