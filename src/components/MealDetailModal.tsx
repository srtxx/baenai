import React, { useState } from "react";
import { photoUrl } from "../utils/helpers";
import { DAYS, MEAL_LABELS } from "../constants";
import { DayIndex, MealIndex, Meal } from "../types";

interface MealDetailModalProps {
  di: DayIndex;
  mi: MealIndex;
  meal: Meal;
  onClose: () => void;
  onDelete: (di: DayIndex, mi: MealIndex) => void;
  onSave?: (di: DayIndex, mi: MealIndex, mealData: Meal) => void;
}

export default function MealDetailModal({
  di,
  mi,
  meal,
  onClose,
  onDelete,
  onSave,
}: MealDetailModalProps): React.JSX.Element {
  const mealLabel = MEAL_LABELS[mi] || "ごはん";

  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState<string>(
    meal && "note" in meal && meal.note ? meal.note : ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    meal && "tags" in meal && meal.tags ? meal.tags : []
  );

  const tagsList = ["自炊", "外食", "コンビニ", "テイクアウト"] as const;

  if (!meal) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-title">記録がありません</div>
          <button onClick={onClose} className="btn-cancel" style={{ marginTop: "16px" }}>
            閉じる
          </button>
        </div>
      </div>
    );
  }

  const isSkipped = "skipped" in meal && meal.skipped;

  if (isSkipped) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content meal-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header-row">
            <div>
              <h2 className="modal-title">
                {DAYS[di]}曜日 — {mealLabel}
              </h2>
              <p className="modal-subtitle">食事の記録</p>
            </div>
            <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
              ✕
            </button>
          </div>

          <div className="detail-polaroid-frame">
            <div className="detail-emoji-preview">
              <span className="detail-emoji-large">🌙</span>
            </div>
            <div className="detail-meta-box">
              <p className="detail-notes">この食事は休食（スキップ）しました</p>
            </div>
          </div>

          <div className="btn-modal-actions-row" style={{ marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => {
                onDelete(di, mi);
                onClose();
              }}
              className="btn-modal-primary"
            >
              ✏️ 記録をし直す
            </button>
            <button type="button" onClick={onClose} className="btn-modal-secondary">
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

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveEdit = () => {
    if (onSave) {
      onSave(di, mi, {
        image: "image" in meal ? meal.image : undefined,
        quickEmoji: "quickEmoji" in meal ? meal.quickEmoji : undefined,
        note: note.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content meal-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">
              {DAYS[di]}曜日 — {mealLabel}
            </h2>
            <p className="modal-subtitle">食事の記録</p>
          </div>
          <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
            ✕
          </button>
        </div>

        {/* Meal Photo or Emoji: Polaroid Card Style */}
        <div className="detail-polaroid-frame">
          {imgSrc ? (
            <div className="detail-preview">
              <img src={imgSrc} alt="食事の写真" className="detail-image" />
            </div>
          ) : quickEmoji ? (
            <div className="detail-emoji-preview">
              <span className="detail-emoji-large">{quickEmoji}</span>
            </div>
          ) : null}

          {/* Meta Info within Card */}
          {!isEditing && (hasNote || hasTags) && (
            <div className="detail-meta-box">
              {hasNote && <p className="detail-notes">“{meal.note}”</p>}
              {hasTags && meal.tags && (
                <div className="detail-tags">
                  {meal.tags.map((tag) => (
                    <span key={tag} className="detail-tag-badge">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Form Mode */}
        {isEditing ? (
          <div className="detail-edit-form">
            <div className="modal-input-group">
              <label className="modal-input-label">ひとこと（メモ）</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="メニューや感想など"
                className="modal-textarea"
                rows={2}
                autoFocus
              />
            </div>

            <div className="modal-input-group">
              <label className="modal-input-label">カテゴリータグ</label>
              <div className="tag-chips">
                {tagsList.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-chip ${selectedTags.includes(tag) ? "active" : ""}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="btn-modal-actions-row">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-modal-secondary"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="btn-modal-primary"
              >
                保存する
              </button>
            </div>
          </div>
        ) : (
          /* View Mode Actions */
          <div className="detail-action-list">
            {onSave && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-detail-edit"
              >
                ✏️ メモやタグを編集する
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onDelete(di, mi);
                onClose();
              }}
              className="btn-detail-delete"
            >
              🗑️ この記録を取り消す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
