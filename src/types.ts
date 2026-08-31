/** 食事記録（写真あり、またはクイック絵文字記録） */
export interface MealWithPhoto {
  image?: string;
  quickEmoji?: string;
  note?: string;
  tags?: string[];
  seed?: never;
  skipped?: never;
}

/** デモ用プレースホルダー */
export interface MealPlaceholder {
  seed: string;
  image?: never;
  note?: never;
  tags?: never;
  skipped?: never;
}

/** スキップされた食事 */
export interface MealSkipped {
  skipped: true;
  image?: never;
  note?: never;
  tags?: never;
  seed?: never;
}

/** 食事データの型 */
export type Meal = MealWithPhoto | MealPlaceholder | MealSkipped | null;

/** 1週間の食事データ（7日 × 3食） */
export type WeekMeals = [Meal, Meal, Meal][];

/** 曜日インデックス（月=0, 日=6） */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 食事インデックス（朝=0, 昼=1, 夜=2） */
export type MealIndex = 0 | 1 | 2;

/** 食事スロットの位置 */
export interface MealSlot {
  di: DayIndex;
  mi: MealIndex;
}

/** ユーザープロフィール */
export interface UserProfile {
  id?: string;
  name: string;
  avatar?: string;
  handle?: string;
  friendCode?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

/** 催促（Nudge）の種類 */
export type EncourageType = "otsukare" | "erai" | "yuruku" | "saikou" | "ganbarou" | "onaka";

/** 催促レコード */
export interface Encouragement {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  encourageType: EncourageType;
  message: string;
  createdAt: string;
  isRead?: boolean;
}

/** リアクションの種類 */
export type ReactionType = "otsukare" | "erai" | "yuruku" | "oishisou";

/** リアクションレコード */
export interface Reaction {
  id: string;
  mealSlotKey: string; // `${weekKey}_${di}_${mi}`
  userId: string;
  userName: string;
  reactionType: ReactionType;
  createdAt: string;
}

/** リアルタイム配給フィード項目 */
export interface FeedItem {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  dayIndex: DayIndex;
  mealIndex: MealIndex;
  meal: Meal;
  loggedAt: string;
  reactions: { type: ReactionType; count: number; users: string[] }[];
}

/** 実績バッジ */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: { current: number; max: number };
}

/** シェア画像の設定 */
export type ShareRatio = "4:5" | "9:16" | "1:1";
export type ShareTheme = "ecru" | "dark" | "sage";

/** フレンド情報 */
export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  handle?: string;
  friendCode: string;
  todayStatus: {
    breakfast: "logged" | "skipped" | "unlogged";
    lunch: "logged" | "skipped" | "unlogged";
    dinner: "logged" | "skipped" | "unlogged";
  };
  meals: WeekMeals;
  lastActiveAt?: string;
}

/** ナビゲーションのタブ */
export type ActiveTab = "home" | "friends";

/** モーダルの状態 */
export type ModalState =
  | "add"
  | "detail"
  | "settings"
  | "share"
  | "add_friend"
  | "notifications"
  | "achievements"
  | null;
