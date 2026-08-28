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
