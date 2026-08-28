/** 写真付きの食事記録 */
export interface MealWithPhoto {
  image: string;
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

/** モーダルの状態 */
export type ModalState = "add" | "detail" | "settings" | null;

