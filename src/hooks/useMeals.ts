import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getSavedMeals, saveMealSlot, deleteMealSlot, clearAllMeals } from "../db";
import { WeekMeals, Meal, DayIndex, MealIndex } from "../types";

export function createEmptyWeek(): WeekMeals {
  return Array(7)
    .fill(null)
    .map(() => [null, null, null]) as WeekMeals;
}

export function useMeals(weekKey: string) {
  const [meals, setMeals] = useState<WeekMeals>(() => createEmptyWeek());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const currentWeekKeyRef = useRef(weekKey);

  useEffect(() => {
    currentWeekKeyRef.current = weekKey;
  }, [weekKey]);

  // 起動時・週切り替え時のデータ読み込み
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const saved = await getSavedMeals(weekKey);
        if (!isMounted) return;

        if (saved) {
          // もし過去のデモデータ（seedプロパティのみのオブジェクト）が含まれていたら空データとして扱う
          const hasOldDemoData = saved.some((day) =>
            day.some((m) => m && "seed" in m && !("image" in m) && !("skipped" in m))
          );
          if (hasOldDemoData) {
            setMeals(createEmptyWeek());
          } else {
            setMeals(saved);
          }
        } else {
          setMeals(createEmptyWeek());
        }
      } catch (e) {
        console.error("Failed to load saved meals from IndexedDB", e);
        if (isMounted) setMeals(createEmptyWeek());
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [weekKey]);

  // 1食単位（アトミック）で保存：楽観的UI更新 + 個別レコード書き込み
  const saveMeal = useCallback(
    (di: DayIndex, mi: MealIndex, mealData: Meal) => {
      const targetWeekKey = currentWeekKeyRef.current;

      // 1. 楽観的UI更新（即時反映）
      setMeals((prev) => {
        const next = prev.map((dayMeals, dIndex) => {
          if (dIndex === di) {
            return dayMeals.map((meal, mIndex) => {
              if (mIndex === mi) {
                return mealData;
              }
              return meal;
            });
          }
          return dayMeals;
        }) as WeekMeals;
        return next;
      });

      // 2. DBへ1食レコードをアトミック保存（バックグラウンド非同期）
      saveMealSlot(targetWeekKey, di, mi, mealData).catch((err) => {
        console.error("Failed to save meal slot to IndexedDB:", err);
      });
    },
    []
  );

  // 1食単位で削除：楽観的UI更新 + 個別レコード削除
  const deleteMeal = useCallback(
    (di: DayIndex, mi: MealIndex) => {
      const targetWeekKey = currentWeekKeyRef.current;

      // 1. 楽観的UI更新（即時反映）
      setMeals((prev) => {
        const next = prev.map((dayMeals, dIndex) => {
          if (dIndex === di) {
            return dayMeals.map((meal, mIndex) => {
              if (mIndex === mi) {
                return null;
              }
              return meal;
            });
          }
          return dayMeals;
        }) as WeekMeals;
        return next;
      });

      // 2. DBから1食レコードを削除（バックグラウンド非同期）
      deleteMealSlot(targetWeekKey, di, mi).catch((err) => {
        console.error("Failed to delete meal slot from IndexedDB:", err);
      });
    },
    []
  );

  const resetAllData = useCallback(async () => {
    try {
      await clearAllMeals();
      setMeals(createEmptyWeek());
    } catch (e) {
      console.error("Failed to clear IndexedDB", e);
    }
  }, []);

  // 統計情報の算出
  const stats = useMemo(() => {
    let photoCount = 0;
    let skipCount = 0;
    meals.forEach((day) => {
      day.forEach((m) => {
        if (m) {
          if ("image" in m && m.image) photoCount++;
          else if ("skipped" in m && m.skipped) skipCount++;
        }
      });
    });
    return {
      photoCount,
      skipCount,
      totalLogged: photoCount + skipCount,
      totalSlots: 21,
    };
  }, [meals]);

  return { meals, isLoading, saveMeal, deleteMeal, resetAllData, stats };
}
