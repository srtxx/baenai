import { useState, useEffect, useCallback } from "react";
import { Achievement, WeekMeals } from "../types";

const REFLECTIONS_STORAGE_KEY = "mog_reflections_v2";

const INITIAL_REFLECTIONS: Achievement[] = [
  {
    id: "first_meal",
    title: "はじめの一歩",
    description: "最初の食事を記録した",
    icon: "🌱",
    unlocked: false,
  },
  {
    id: "three_meals",
    title: "三食のめぐみ",
    description: "1日で朝・昼・夜の3食すべてを記録した",
    icon: "🍱",
    unlocked: false,
  },
  {
    id: "home_cook",
    title: "つくるよろこび",
    description: "1週間に5食以上自炊で記録した",
    icon: "🍳",
    unlocked: false,
  },
  {
    id: "rest_kindness",
    title: "無理しない勇気",
    description: "おやすみを3回以上記録した",
    icon: "🌙",
    unlocked: false,
  },
  {
    id: "weekly_record",
    title: "一週間のmog",
    description: "1週間のうち15食以上を記録した",
    icon: "📓",
    unlocked: false,
  },
  {
    id: "share_week",
    title: "今週のふりかえり",
    description: "週報画像を生成・保存した",
    icon: "🖼",
    unlocked: false,
  },
  {
    id: "all_week_logged",
    title: "満ち足りた一週間",
    description: "1週間の全21マスを記録またはおやすみで埋めた",
    icon: "✨",
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

