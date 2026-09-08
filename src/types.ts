/** 食事記録（写真あり、または生活スタイル記録） */
export interface MealWithPhoto {
  image?: string;
  style?: "cook" | "store" | "out" | "cafe" | "takeout";
  iconKey?: string;
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

/** カラーテーマ */
export type ThemeMode = "ecru" | "night";

/** ユーザープロフィール */
export interface UserProfile {
  id?: string;
  name: string;
  avatar?: string;
  handle?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  themePreference?: ThemeMode;
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

/** モーダルの状態 */
export type ModalState =
  | "add"
  | "detail"
  | "settings"
  | "share"
  | "achievements"
  | null;

