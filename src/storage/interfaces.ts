import { DayIndex, MealIndex, UserProfile } from "../types";

/**
 * 1食単位（アトミック）で永続化される正規化レコード
 */
export interface StoredMealRecord {
  /** 一意なID（例: `${weekKey}_${di}_${mi}`） */
  id: string;
  /** 週の識別子（例: '2026-W37'） */
  weekKey: string;
  /** 曜日インデックス（月:0 〜 日:6） */
  dayIndex: DayIndex;
  /** 食事インデックス（朝:0, 昼:1, 夜:2） */
  mealIndex: MealIndex;
  /** 記録日時（ISO8601文字列） */
  recordedAt: string;
  /** 食事スタイル */
  style?: "cook" | "store" | "out" | "cafe" | "takeout";
  /** アイコン識別子 */
  iconKey?: string;
  /** クイック絵文字キー */
  quickEmoji?: string;
  /** メモ本文 */
  note?: string;
  /** 付与されたタグ配列 */
  tags?: string[];
  /** 休食フラグ */
  skipped?: boolean;
  /** 保存画像への参照ID（imagesストアのPK） */
  imageId?: string;
  /** 最終更新タイムスタンプ（ミリ秒） */
  updatedAt: number;
  /** クラウド同期状態（オフラインファースト / Supabase連携用） */
  syncStatus?: "synced" | "pending";
}

/**
 * 画像ストアに保存されるバイナリレコード
 */
export interface StoredImageRecord {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

/**
 * カスタムタグマスタレコード
 */
export interface StoredTagRecord {
  tag: string;
  createdAt: number;
  useCount: number;
}

/**
 * 食事リポジトリの抽象インターフェース
 * SQLiteやクラウドDBへの差し替えを想定
 */
export interface IMealRepository {
  /** 指定した週の全食事レコードを取得 */
  getMealsByWeek(weekKey: string): Promise<StoredMealRecord[]>;
  /** 1食分のレコードを取得 */
  getMeal(weekKey: string, dayIndex: DayIndex, mealIndex: MealIndex): Promise<StoredMealRecord | null>;
  /** 1食分のレコードをアトミックに保存/更新 */
  saveMeal(record: StoredMealRecord): Promise<void>;
  /** 1食分のレコードを削除 */
  deleteMeal(weekKey: string, dayIndex: DayIndex, mealIndex: MealIndex): Promise<void>;
  /** すべての食事記録を初期化（プロフィールは除外） */
  clearAllMeals(): Promise<void>;
  /** 全期間の累計タグ一覧を取得 */
  getAllTags(): Promise<string[]>;
}

/**
 * 画像ストレージリポジトリの抽象インターフェース
 * ローカルIndexedDBや端末ファイルシステム、クラウドStorageへの差し替えを想定
 */
export interface IImageRepository {
  /** 画像Blobを取得 */
  getImage(id: string): Promise<Blob | null>;
  /** 画像Blobを保存 */
  saveImage(id: string, blob: Blob, mimeType?: string): Promise<void>;
  /** 画像を削除 */
  deleteImage(id: string): Promise<void>;
  /** すべての画像を初期化 */
  clearAllImages(): Promise<void>;
}

/**
 * ユーザープロフィールリポジトリの抽象インターフェース
 */
export interface IProfileRepository {
  /** ユーザープロフィールを取得 */
  getProfile(): Promise<UserProfile>;
  /** ユーザープロフィールを保存 */
  saveProfile(profile: UserProfile): Promise<void>;
}

/**
 * カスタムタグリポジトリの抽象インターフェース
 */
export interface ITagRepository {
  /** カスタムタグ一覧を取得 */
  getTags(): Promise<string[]>;
  /** カスタムタグを追加 */
  addTag(tag: string): Promise<void>;
  /** カスタムタグを削除 */
  removeTag(tag: string): Promise<void>;
  /** タグリストを一括保存 */
  saveTags(tags: string[]): Promise<void>;
}
