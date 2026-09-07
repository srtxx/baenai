import { useState, useEffect, useCallback } from "react";
import { Achievement, WeekMeals } from "../types";

const REFLECTIONS_STORAGE_KEY = "mog_reflections_v3";

const INITIAL_REFLECTIONS: Achievement[] = [
  {
    id: "first_meal",
    title: "最初の記録",
    description: "日々の食の記録をはじめました",
    icon: "leaf",
    unlocked: false,
  },
  {
    id: "three_meals",
    title: "ある日の3食",
    description: "朝・昼・夜を記録した一日",
    icon: "log",
    unlocked: false,
  },
  {
    id: "home_cook",
    title: "台所に立った週",
    description: "5食以上、自炊で過ごした",
    icon: "fire",
    unlocked: false,
  },
  {
    id: "rest_kindness",
    title: "休息の多い週",
    description: "食べない時間も大切にした",
    icon: "moon",
    unlocked: false,
  },
  {
    id: "weekly_record",
    title: "ウィークリーログ",
    description: "週15食以上を記録した",
    icon: "calendar",
    unlocked: false,
  },
  {
    id: "share_week",
    title: "週報の保存",
    description: "週報画像を生成・保存した",
    icon: "share",
    unlocked: false,
  },
  {
    id: "all_week_logged",
    title: "21マスの記録",
    description: "1週間の全スロットを記録した",
    icon: "sparkle",
    unlocked: false,
  },
];

export function useAchievements(meals?: WeekMeals) {
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(REFLECTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_REFLECTIONS;
  });

  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement | null>(null);

  const unlock = useCallback((id: string) => {
    setAchievements((prev) => {
      let newlyUnlockedItem: Achievement | null = null;
      const next = prev.map((a) => {
        if (a.id === id && !a.unlocked) {
          newlyUnlockedItem = {
            ...a,
            unlocked: true,
            unlockedAt: new Date().toLocaleDateString("ja-JP"),
          };
          return newlyUnlockedItem;
        }
        return a;
      });
      if (newlyUnlockedItem) {
        setRecentlyUnlocked(newlyUnlockedItem);
        try {
          localStorage.setItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        setTimeout(() => setRecentlyUnlocked(null), 4000);
      }
      return next;
    });
  }, []);

  // 自動アンロック判定
  useEffect(() => {
    if (!meals) return;

    let totalLogged = 0;
    let cookCount = 0;
    let restCount = 0;
    let hasFullDay = false;

    meals.forEach((day) => {
      let dayFilledCount = 0;
      day.forEach((m) => {
        if (m) {
          dayFilledCount++;
          if ("skipped" in m && m.skipped) {
            restCount++;
          }
          totalLogged++;
          if ("tags" in m && m.tags) {
            if (m.tags.includes("自炊")) cookCount++;
          }
        }
      });
      if (dayFilledCount === 3) {
        hasFullDay = true;
      }
    });

    if (totalLogged >= 1) unlock("first_meal");
    if (hasFullDay) unlock("three_meals");
    if (cookCount >= 5) unlock("home_cook");
    if (restCount >= 3) unlock("rest_kindness");
    if (totalLogged >= 15) unlock("weekly_record");
    if (totalLogged >= 21) unlock("all_week_logged");
  }, [meals, unlock]);

  const recordShareGenerated = useCallback(() => {
    unlock("share_week");
  }, [unlock]);

  return {
    achievements,
    recentlyUnlocked,
    unlock,
    recordShareGenerated,
  };
}

