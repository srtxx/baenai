import { Friend, Encouragement, Reaction, WeekMeals } from "../types";

const FRIENDS_KEY = "mog_friends_v1";
const ENCOURAGEMENTS_KEY = "mog_encouragements_v1";
const REACTIONS_KEY = "mog_reactions_v1";

// ランダムなフレンドコード生成 (例: RN-8241)
export function generateFriendCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RN-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// デモ用フレンド食事データ生成
function createMockWeekMeals(type: "cook" | "convenience" | "stoic"): WeekMeals {
  const week: WeekMeals = Array(7).fill(null).map(() => [null, null, null]);

  // 写真プレースホルダー (picsum)
  const seeds = {
    cook: ["cook1", "cook2", "cook3", "cook4", "cook5", "cook6"],
    convenience: ["conv1", "conv2", "conv3", "conv4", "conv5"],
    stoic: ["stoic1", "stoic2", "stoic3", "stoic4", "stoic5"],
  };

  const currentSeedList = seeds[type];

  // 月曜〜金曜の一部を埋める
  for (let d = 0; d < 5; d++) {
    // 朝
    if (d % 2 === 0) {
      week[d][0] = {
        image: `https://picsum.photos/seed/${currentSeedList[d % currentSeedList.length]}_m/400/300`,
        note: type === "cook" ? "目玉焼きとトースト" : type === "stoic" ? "プロテインとバナナ" : "コンビニおにぎり",
        tags: type === "cook" ? ["自炊"] : type === "stoic" ? ["自炊"] : ["コンビニ"]
      };
    } else {
      week[d][0] = { skipped: true };
    }

    // 昼
    week[d][1] = {
      image: `https://picsum.photos/seed/${currentSeedList[(d + 1) % currentSeedList.length]}_l/400/300`,
      note: type === "cook" ? "昨晩の残りもの弁当" : type === "convenience" ? "カップ麺" : "サラダチキンと玄米",
      tags: type === "cook" ? ["自炊"] : type === "convenience" ? ["コンビニ"] : ["自炊"]
    };

    // 夜
    if (d < 3) {
      week[d][2] = {
        image: `https://picsum.photos/seed/${currentSeedList[(d + 2) % currentSeedList.length]}_d/400/300`,
        note: type === "cook" ? "適当野菜炒め" : type === "convenience" ? "弁当" : "鶏むね肉ソテー",
        tags: type === "cook" ? ["自炊"] : type === "convenience" ? ["コンビニ"] : ["自炊"]
      };
    }
  }

  return week;
}

// デフォルトのともだち一覧
export function getDefaultFriends(): Friend[] {
  return [
    {
      id: "friend_1",
      name: "タナカ",
      handle: "@tanaka",
      friendCode: "RN-8821",
      todayStatus: {
        breakfast: "skipped",
        lunch: "logged",
        dinner: "unlogged"
      },
      meals: createMockWeekMeals("cook"),
      lastActiveAt: "15分前"
    },
    {
      id: "friend_2",
      name: "ユウキ",
      handle: "@yuuki",
      friendCode: "RN-3490",
      todayStatus: {
        breakfast: "unlogged",
        lunch: "logged",
        dinner: "unlogged"
      },
      meals: createMockWeekMeals("convenience"),
      lastActiveAt: "2時間前"
    },
    {
      id: "friend_3",
      name: "ケンジ",
      handle: "@kenji",
      friendCode: "RN-6104",
      todayStatus: {
        breakfast: "logged",
        lunch: "logged",
        dinner: "logged"
      },
      meals: createMockWeekMeals("stoic"),
      lastActiveAt: "ちょうど今"
    }
  ];
}

// ストレージからフレンド取得
export function getSavedFriends(): Friend[] {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    if (!raw) {
      const defaults = getDefaultFriends();
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultFriends();
  }
}

// ストレージにフレンド保存
export function saveFriends(friends: Friend[]): void {
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch (e) {
    console.error("Failed to save friends", e);
  }
}

// ストレージから励ましメッセージ一覧取得
export function getSavedEncouragements(): Encouragement[] {
  try {
    const raw = localStorage.getItem(ENCOURAGEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// 励ましメッセージの保存
export function saveEncouragement(encouragement: Encouragement): void {
  try {
    const list = getSavedEncouragements();
    list.unshift(encouragement);
    localStorage.setItem(ENCOURAGEMENTS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.error("Failed to save encouragement", e);
  }
}

// リアクション一覧取得
export function getSavedReactions(): Reaction[] {
  try {
    const raw = localStorage.getItem(REACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// リアクション保存
export function saveReaction(reaction: Reaction): void {
  try {
    const list = getSavedReactions();
    list.push(reaction);
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save reaction", e);
  }
}
