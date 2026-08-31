import React from "react";
import { photoUrl } from "../utils/helpers";
import { DAYS, MEAL_LABELS } from "../constants";
import { DayIndex, MealIndex, Meal } from "../types";

interface MealDetailModalProps {
  di: DayIndex;
  mi: MealIndex;
  meal: Meal;
  onClose: () => void;
  onDelete: (di: DayIndex, mi: MealIndex) => void;
}

export default function MealDetailModal({ di, mi, meal, onClose, onDelete }: MealDetailModalProps): React.JSX.Element {
  const mealLabel = MEAL_LABELS[mi] || "ごはん";

  if (!meal) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">記録がありません</div>
          <button onClick={onClose} className="btn-close">閉じる</button>
        </div>
      </div>
    );
  }

  const isSkipped = "skipped" in meal && meal.skipped;

  if (isSkipped) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">
            {DAYS[di]}曜日 — {mealLabel}
          </div>
          <div className="modal-subtitle-detail">
            この食事はおやすみしました 🌙
          </div>

          <div className="btn-group-vertical">
            <button
              onClick={() => {
                onDelete(di, mi);
                onClose();
              }}
              className="btn-action-restore"
            >
              記録をし直す
            </button>
            <button
              onClick={onClose}
              className="btn-close"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  let imgSrc = "";
  if ("image" in meal && meal.image) {
    imgSrc = meal.image;
  } else if ("seed" in meal && meal.seed) {
    imgSrc = photoUrl(meal.seed, 400, 300);
  }

  const quickEmoji = "quickEmoji" in meal ? meal.quickEmoji : undefined;
  const hasNote = "note" in meal && meal.note;
  const hasTags = "tags" in meal && meal.tags && meal.tags.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {DAYS[di]}曜日 — {mealLabel}
        </div>
        <div className="modal-subtitle-detail">
          もぐの記録
        </div>

        {/* Meal Photo or Emoji */}
        {imgSrc ? (
          <div className="detail-preview">
            <img src={imgSrc} alt="食事の写真" className="detail-image" />
          </div>
        ) : quickEmoji ? (
          <div className="detail-emoji-preview">
            <span className="detail-emoji-large">{quickEmoji}</span>
          </div>
        ) : null}

        {/* メモ・タグ表示 */}
        {(hasNote || hasTags) && (
          <div className="detail-meta-box">
            {hasNote && <div className="detail-notes">{meal.note}</div>}
            {hasTags && meal.tags && (
              <div className="detail-tags">
                {meal.tags.map(tag => (
                  <span key={tag} className="detail-tag-badge">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="btn-group-vertical">
          <button
            onClick={() => {
              onDelete(di, mi);
              onClose();
            }}
            className="btn-delete"
          >
            この記録を取り消す
          </button>
          <button
            onClick={onClose}
            className="btn-close"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
