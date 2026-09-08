import { DayIndex, Meal, MealIndex, MealWithPhoto, UserProfile, WeekMeals } from "./types";
import { StoredMealRecord } from "./storage/interfaces";
import {
  mealRepository,
  imageRepository,
  profileRepository,
  tagRepository,
} from "./storage/indexeddb/repositories";
import { dataUrlToBlob, blobToDataUrl } from "./storage/indexeddb/database";

/**
 * 空の1週間（7日 × 3食）グリッドを作成
 */
export function createEmptyWeekGrid(): WeekMeals {
  return Array(7)
    .fill(null)
    .map(() => [null, null, null]) as WeekMeals;
}

/**
 * 指定した週の食事データを取得（1食1レコードから7×3配列を復元）
 */
export async function getSavedMeals(weekKey = "default"): Promise<WeekMeals | null> {
  try {
    const records = await mealRepository.getMealsByWeek(weekKey);
    if (!records || records.length === 0) {
      return null;
    }

    const grid = createEmptyWeekGrid();

    // レコードを 7x3 グリッドへマッピング
    for (const record of records) {
      const di = record.dayIndex;
      const mi = record.mealIndex;
      if (di >= 0 && di < 7 && mi >= 0 && mi < 3) {
        if (record.skipped) {
          grid[di][mi] = { skipped: true };
        } else {
          let imageUrl: string | undefined;
          if (record.imageId) {
            const blob = await imageRepository.getImage(record.imageId);
            if (blob) {
              imageUrl = await blobToDataUrl(blob);
            }
          }

          const mealData: MealWithPhoto = {
            image: imageUrl,
            style: record.style,
            iconKey: record.iconKey,
            quickEmoji: record.quickEmoji,
            note: record.note,
            tags: record.tags,
          };
          grid[di][mi] = mealData;
        }
      }
    }

    return grid;
  } catch (err) {
    console.error("Failed to load meals by week:", err);
    return null;
  }
}

/**
 * 1食単位（アトミック）で食事レコードを保存/更新する
 * 画像はBlob専用ストアへ分離保存し、メタデータのみを更新
 */
export async function saveMealSlot(
  weekKey: string,
  di: DayIndex,
  mi: MealIndex,
  meal: Meal
): Promise<void> {
  const recordId = `${weekKey}_${di}_${mi}`;

  if (!meal) {
    await deleteMealSlot(weekKey, di, mi);
    return;
  }

  // 既存レコードの確認（既存画像IDの再利用チェック）
  const existing = await mealRepository.getMeal(weekKey, di, mi);
  let imageId = existing?.imageId;

  if ("skipped" in meal && meal.skipped) {
    // 休食の場合、もし旧画像があれば削除
    if (imageId) {
      await imageRepository.deleteImage(imageId).catch(() => {});
      imageId = undefined;
    }

    const record: StoredMealRecord = {
      id: recordId,
      weekKey,
      dayIndex: di,
      mealIndex: mi,
      recordedAt: existing?.recordedAt || new Date().toISOString(),
      skipped: true,
      updatedAt: Date.now(),
      syncStatus: "pending",
    };
    await mealRepository.saveMeal(record);
    return;
  }

  // 写真付きまたはスタイル記録の場合
  if ("image" in meal && meal.image) {
    if (meal.image.startsWith("data:image/")) {
      // 新規アップロード画像（DataURL）の場合のみBlobに変換して画像ストアへ保存
      const newImageId = imageId || `img_${recordId}_${Date.now()}`;
      const blob = dataUrlToBlob(meal.image);
      await imageRepository.saveImage(newImageId, blob, blob.type);
      imageId = newImageId;
    }
    // 既存の画像（URLや再利用）で変更がない場合は画像ストアへの再書き込みはスキップ
  } else if (existing?.imageId && (!("image" in meal) || !meal.image)) {
    // 画像が削除された場合
    await imageRepository.deleteImage(existing.imageId).catch(() => {});
    imageId = undefined;
  }

  const mealWithPhoto = meal as MealWithPhoto;
  const record: StoredMealRecord = {
    id: recordId,
    weekKey,
    dayIndex: di,
    mealIndex: mi,
    recordedAt: existing?.recordedAt || new Date().toISOString(),
    style: mealWithPhoto.style,
    iconKey: mealWithPhoto.iconKey,
    quickEmoji: mealWithPhoto.quickEmoji,
    note: mealWithPhoto.note,
    tags: mealWithPhoto.tags,
    skipped: false,
    imageId,
    updatedAt: Date.now(),
    syncStatus: "pending",
  };

  await mealRepository.saveMeal(record);
}

/**
 * 1食分のレコードを削除
 */
export async function deleteMealSlot(
  weekKey: string,
  di: DayIndex,
  mi: MealIndex
): Promise<void> {
  const existing = await mealRepository.getMeal(weekKey, di, mi);
  if (existing?.imageId) {
    await imageRepository.deleteImage(existing.imageId).catch(() => {});
  }
  await mealRepository.deleteMeal(weekKey, di, mi);
}

/**
 * 1週間分の一括保存（後方互換性用）
 */
export async function saveMeals(weekKey = "default", meals: WeekMeals): Promise<void> {
  for (let di = 0; di < meals.length; di++) {
    const day = meals[di];
    for (let mi = 0; mi < day.length; mi++) {
      const meal = day[mi];
      await saveMealSlot(weekKey, di as DayIndex, mi as MealIndex, meal);
    }
  }
}

/**
 * すべての食事データを初期化（プロフィール・タグマスタは安全に保護）
 */
export async function clearAllMeals(): Promise<void> {
  await mealRepository.clearAllMeals();
}

/**
 * ユーザープロファイルを取得
 */
export async function getUserProfile(): Promise<UserProfile> {
  return await profileRepository.getProfile();
}

/**
 * ユーザープロファイルを保存
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await profileRepository.saveProfile(profile);
}

/**
 * カスタムタグ一覧を取得
 */
export async function getCustomTags(): Promise<string[]> {
  let tags = await tagRepository.getTags();
  if (tags.length === 0) {
    // 初期タグが無ければ過去の食事から抽出してマスタ初期化
    const extracted = await mealRepository.getAllTags();
    if (extracted.length > 0) {
      await tagRepository.saveTags(extracted);
      tags = extracted;
    }
  }
  return tags;
}

/**
 * カスタムタグ一覧を保存
 */
export async function saveCustomTags(tags: string[]): Promise<void> {
  await tagRepository.saveTags(tags);
}
