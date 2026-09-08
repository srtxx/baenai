import { useMemo } from "react";
import { Achievement, WeekMeals } from "../types";

export interface RhythmSummary {
  totalLogged: number;
  photoCount: number;
  skipCount: number;
  cookCount: number;
  convenienceCount: number;
  outCount: number;
  cafeCount: number;
  reflections: {
    id: string;
    title: string;
    description: string;
    icon: string;
    count?: number;
    active: boolean;
  }[];
}

export function useAchievements(meals?: WeekMeals) {
  const summary = useMemo<RhythmSummary>(() => {
    let totalLogged = 0;
    let photoCount = 0;
    let skipCount = 0;
    let cookCount = 0;
    let convenienceCount = 0;
    let outCount = 0;
    let cafeCount = 0;

    if (meals) {
      meals.forEach((day) => {
        day.forEach((m) => {
          if (!m) return;
          totalLogged++;
          if ("skipped" in m && m.skipped) {
            skipCount++;
          } else if ("image" in m && m.image) {
            photoCount++;
          }
          if ("style" in m && m.style) {
            if (m.style === "cook") cookCount++;
            if (m.style === "store") convenienceCount++;
            if (m.style === "out") outCount++;
            if (m.style === "cafe") cafeCount++;
          }
          if ("tags" in m && m.tags) {
            if (m.tags.includes("自炊") && (!("style" in m) || m.style !== "cook")) cookCount++;
            if (m.tags.includes("コンビニ") && (!("style" in m) || m.style !== "store")) convenienceCount++;
            if (m.tags.includes("外食") && (!("style" in m) || m.style !== "out")) outCount++;
            if (m.tags.includes("カフェ") && (!("style" in m) || m.style !== "cafe")) cafeCount++;
          }
        });
      });
    }

    const reflections = [
      {
        id: "rest",
        title: "体を休めた時間",
        description: "食べない時間も選べる、静かな休息",
        icon: "moon",
        count: skipCount,
        active: skipCount > 0,
      },
      {
        id: "photo",
        title: "写真に残した食卓",
        description: "日常のそのままの景色",
        icon: "log",
        count: photoCount,
        active: photoCount > 0,
      },
      {
        id: "cook",
        title: "台所に立った日",
        description: "自分のために手を動かした記録",
        icon: "fire",
        count: cookCount,
        active: cookCount > 0,
      },
      {
        id: "convenience",
        title: "コンビニの支え",
        description: "忙しい日を助けてくれた身近な食",
        icon: "leaf",
        count: convenienceCount,
        active: convenienceCount > 0,
      },
      {
        id: "out",
        title: "外で食べたごはん",
        description: "街の味や誰かと囲んだ食卓",
        icon: "sparkle",
        count: outCount,
        active: outCount > 0,
      },
      {
        id: "cafe",
        title: "ひと息ついたカフェ",
        description: "飲み物と静かな時間",
        icon: "calendar",
        count: cafeCount,
        active: cafeCount > 0,
      },
    ];

    return {
      totalLogged,
      photoCount,
      skipCount,
      cookCount,
      convenienceCount,
      outCount,
      cafeCount,
      reflections,
    };
  }, [meals]);

  const achievements: Achievement[] = useMemo(() => {
    return summary.reflections.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      icon: r.icon,
      unlocked: r.active,
      progress: r.count ? { current: r.count, max: r.count } : undefined,
    }));
  }, [summary]);

  return {
    summary,
    achievements,
    recentlyUnlocked: null,
    recordShareGenerated: () => {},
  };
}

