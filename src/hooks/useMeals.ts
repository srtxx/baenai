import { useState, useEffect, useCallback, useMemo } from "react";
import { getSavedMeals, saveMeals, clearAllMeals } from "../db";
import { WeekMeals, Meal, DayIndex, MealIndex } from "../types";

export function createEmptyWeek(): WeekMeals {
  return Array(7)
    .fill(null)
    .map(() => [null, null, null]) as WeekMeals;
}

export function useMeals(weekKey: string) {
  const [meals, setMeals] = useState<WeekMeals>(() => createEmptyWeek());
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
          const hasOldDemoData = saved.some(day =>
            day.some(m => m && "seed" in m && !("image" in m) && !("skipped" in m))
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

  // データ更新時の自動保存
  useEffect(() => {
    if (isLoading) return; // 読み込み完了前は上書き保存を防ぐ
    async function saveData() {
      try {
        await saveMeals(weekKey, meals);
      } catch (e) {
        console.error("Failed to save meals to IndexedDB", e);
      }
    }
    saveData();
  }, [meals, isLoading, weekKey]);

  const saveMeal = useCallback((di: DayIndex, mi: MealIndex, mealData: Meal) => {
    setMeals(prev => {
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
  }, []);

  const deleteMeal = useCallback((di: DayIndex, mi: MealIndex) => {
    setMeals(prev => {
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
  }, []);

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
    meals.forEach(day => {
      day.forEach(m => {
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

