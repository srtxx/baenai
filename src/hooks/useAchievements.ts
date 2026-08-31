import { useState, useEffect, useCallback } from "react";
import { Achievement, WeekMeals } from "../types";

const REFLECTIONS_STORAGE_KEY = "mog_reflections_v1";

const INITIAL_REFLECTIONS: Achievement[] = [
  {
    id: "first_meal",
    title: "はじめの一歩",
    description: "最初の食事を記録した",
    icon: "🌱",
    unlocked: false,
  },
  {
    id: "first_friend",
    title: "ともだち",
    description: "ともだちを追加した",
    icon: "🤝",
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
    id: "encourage_warmth",
    title: "やさしいひとこと",
    description: "ともだちに3回以上ことばを送った",
    icon: "🍵",
    unlocked: false,
    progress: { current: 0, max: 3 },
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
    id: "share_week",
    title: "今週のふりかえり",
    description: "週報を生成・共有した",
    icon: "🖼",
    unlocked: false,
  },
];

export function useAchievements(meals?: WeekMeals, friendsCount = 0) {
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

    meals.forEach((day) => {
      day.forEach((m) => {
        if (m) {
          if ("skipped" in m && m.skipped) {
            restCount++;
          }
          totalLogged++;
          if ("tags" in m && m.tags) {
            if (m.tags.includes("自炊")) cookCount++;
          }
        }
      });
    });

    if (totalLogged >= 1) unlock("first_meal");
    if (totalLogged >= 15) unlock("weekly_record");
    if (cookCount >= 5) unlock("home_cook");
    if (restCount >= 3) unlock("rest_kindness");
    if (friendsCount >= 1) unlock("first_friend");
  }, [meals, friendsCount, unlock]);

  const recordEncourageSent = useCallback(() => {
    setAchievements((prev) => {
      const next = prev.map((a) => {
        if (a.id === "encourage_warmth" && !a.unlocked && a.progress) {
          const newCurrent = a.progress.current + 1;
          if (newCurrent >= a.progress.max) {
            unlock("encourage_warmth");
          }
          return {
            ...a,
            progress: { ...a.progress, current: newCurrent },
          };
        }
        return a;
      });
      try {
        localStorage.setItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [unlock]);

  const recordShareGenerated = useCallback(() => {
    unlock("share_week");
  }, [unlock]);

  return {
    achievements,
    recentlyUnlocked,
    unlock,
    recordEncourageSent,
    recordShareGenerated,
  };
}
