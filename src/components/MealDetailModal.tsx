import React from "react";
import { photoUrl } from "../utils/helpers";
import { DAYS } from "../constants";
import { DayIndex, MealIndex, Meal } from "../types";

interface MealDetailModalProps {
  di: DayIndex;
  mi: MealIndex;
  meal: Meal;
  onClose: () => void;
  onDelete: (di: DayIndex, mi: MealIndex) => void;
}

export default function MealDetailModal({ di, mi, meal, onClose, onDelete }: MealDetailModalProps): React.JSX.Element {
  if (!meal) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">データがありません</div>
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
            {DAYS[di]}曜日 — {mi === 0 ? "朝食" : mi === 1 ? "昼食" : "夕食"}
          </div>
          <div className="modal-subtitle-detail">
            この食事はスキップされました
          </div>

          <div className="btn-group-vertical">
            <button
              onClick={() => {
                onDelete(di, mi);
                onClose();
              }}
              className="btn-action-restore"
            >
              スキップを解除して記録する
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

  const hasNote = "note" in meal && meal.note;
  const hasTags = "tags" in meal && meal.tags && meal.tags.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {DAYS[di]}曜日 — {mi === 0 ? "朝食" : mi === 1 ? "昼食" : "夕食"}
        </div>
        <div className="modal-subtitle-detail">
          食事の記録
        </div>

        {/* Meal Photo */}
        <div className="detail-preview">
          {imgSrc && <img src={imgSrc} alt="食事の写真" className="detail-image" />}
        </div>

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
            この記録を削除
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
