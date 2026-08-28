import { useState, useEffect } from "react";
import { getSavedMeals, saveMeals } from "../db";
import { getMondayOfCurrentWeek, getWeekKey } from "../utils/helpers";
import { WeekMeals, Meal, DayIndex, MealIndex } from "../types";

const weekDataDefault: WeekMeals = [
  [
    { seed: "huel1" },
    { seed: "chicken1" },
    { seed: "broc1" },
  ],
  [
    { seed: "huel2" },
    { seed: "bento1" },
    { seed: "sasami1" },
  ],
  [
    { seed: "huel3" },
    { seed: "salad1" },
    { seed: "sasami2" },
  ],
  [
    { seed: "huel4" },
    { seed: "sasami3" },
    null,
  ],
  [
    { seed: "huel5" },
    { seed: "pepper1" },
    { seed: "broc2" },
  ],
  [
    { seed: "egg1" },
    { seed: "sushi1" },
    { seed: "broc3" },
  ],
  [
    { seed: "huel6" },
    null,
    null,
  ],
];

export function useMeals(weekKey: string) {
  const [meals, setMeals] = useState<WeekMeals>(weekDataDefault);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 起動時・週切り替え時のデータ読み込み
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const saved = await getSavedMeals(weekKey);
        if (saved) {
          setMeals(saved);
        } else {
          const currentWeekKey = getWeekKey(getMondayOfCurrentWeek());
          if (weekKey === currentWeekKey) {
            setMeals(weekDataDefault);
          } else {
            setMeals(Array(7).fill(null).map(() => Array(3).fill(null)) as WeekMeals);
          }
        }
      } catch (e) {
        console.error("Failed to load saved meals from IndexedDB", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
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

  const saveMeal = (di: DayIndex, mi: MealIndex, mealData: Meal) => {
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
  };

  const deleteMeal = (di: DayIndex, mi: MealIndex) => {
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
  };

  return { meals, isLoading, saveMeal, deleteMeal };
}
