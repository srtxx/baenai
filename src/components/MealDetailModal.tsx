import React, { useState, useMemo } from "react";
import { Icon } from "./icons/Icons";
import { photoUrl } from "../utils/helpers";
import { DAYS, MEAL_LABELS, PRESET_TAGS } from "../constants";
import { DayIndex, MealIndex, Meal } from "../types";

interface MealDetailModalProps {
  di: DayIndex;
  mi: MealIndex;
  meal: Meal;
  onClose: () => void;
  onDelete: (di: DayIndex, mi: MealIndex) => void;
  onSave?: (di: DayIndex, mi: MealIndex, mealData: Meal) => void;
  initialEditing?: boolean;
  customTags?: string[];
  onAddCustomTag?: (tag: string) => string | null;
  onRemoveCustomTag?: (tag: string) => void;
}

export default function MealDetailModal({
  di,
  mi,
  meal,
  onClose,
  onDelete,
  onSave,
  initialEditing = false,
  customTags = [],
  onAddCustomTag,
  onRemoveCustomTag,
}: MealDetailModalProps): React.JSX.Element {
  const mealLabel = MEAL_LABELS[mi] || "ごはん";

  const [isEditing, setIsEditing] = useState<boolean>(initialEditing);
  const [note, setNote] = useState<string>(
    meal && "note" in meal && meal.note ? meal.note : ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    meal && "tags" in meal && meal.tags ? meal.tags : []
  );
  const [customTagInput, setCustomTagInput] = useState<string>("");

  // 保存済みカスタムタグマスタと現在選択中タグの統合
  const allCustomTags = useMemo(() => {
    const list = [...customTags];
    selectedTags.forEach((t) => {
      if (!PRESET_TAGS.includes(t as typeof PRESET_TAGS[number]) && !list.includes(t)) {
        list.push(t);
      }
    });
    return list;
  }, [customTags, selectedTags]);

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
              <Icon.Close />
            </button>
          </div>

          <div className="detail-polaroid-frame">
            <div className="detail-emoji-preview">
              <span className="detail-emoji-large"><Icon.Moon size={44} /></span>
            </div>
            <div className="detail-meta-box">
              <p className="detail-notes">この時間は体を休めました（休食）</p>
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
              <Icon.Edit size={16} /> 記録をし直す
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

  const styleKey = ("iconKey" in meal && meal.iconKey) || ("style" in meal && meal.style);
  const quickEmoji = "quickEmoji" in meal ? meal.quickEmoji : undefined;
  const hasNote = "note" in meal && meal.note;
  const hasTags = "tags" in meal && meal.tags && meal.tags.length > 0;

  const renderDetailIcon = () => {
    switch (styleKey) {
      case "pan":
      case "cook":
        return <Icon.Pan size={44} />;
      case "store":
        return <Icon.Store size={44} />;
      case "utensils":
      case "out":
        return <Icon.Utensils size={44} />;
      case "coffee":
      case "cafe":
        return <Icon.Coffee size={44} />;
      case "takeout":
        return <Icon.Takeout size={44} />;
      default:
        return <Icon.Utensils size={44} />;
    }
  };


  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTag = customTagInput.trim().replace(/^#+/, "");
    if (!cleanTag) return;
    if (!selectedTags.includes(cleanTag)) {
      setSelectedTags((prev) => [...prev, cleanTag]);
    }
    if (onAddCustomTag) {
      onAddCustomTag(cleanTag);
    }
    setCustomTagInput("");
  };

  const handleSaveEdit = () => {
    if (onAddCustomTag) {
      selectedTags.forEach((t) => {
        if (!PRESET_TAGS.includes(t as typeof PRESET_TAGS[number])) {
          onAddCustomTag(t);
        }
      });
    }
    if (onSave) {
      onSave(di, mi, {
        image: "image" in meal ? meal.image : undefined,
        style: "style" in meal ? meal.style : undefined,
        iconKey: "iconKey" in meal ? meal.iconKey : undefined,
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
            <Icon.Close />
          </button>
        </div>

        {/* Meal Photo or Style Icon: Polaroid Card Style */}
        <div className="detail-polaroid-frame">
          {imgSrc ? (
            <div className="detail-preview">
              <img src={imgSrc} alt="食事の写真" className="detail-image" />
            </div>
          ) : styleKey ? (
            <div className="detail-emoji-preview">
              <span className="detail-style-icon-large">{renderDetailIcon()}</span>
            </div>
          ) : quickEmoji ? (
            <div className="detail-emoji-preview">
              <span className="detail-emoji-large">{quickEmoji}</span>
            </div>
          ) : (
            <div className="detail-emoji-preview">
              <span className="detail-style-icon-large"><Icon.Utensils size={44} /></span>
            </div>
          )}

          {/* Meta Info within Card */}
          {!isEditing && (
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
              {!hasNote && !hasTags && (
                <p className="detail-empty-meta">メモやタグはまだ登録されていません</p>
              )}
            </div>
          )}
        </div>

        {/* Edit Form Mode */}
        {isEditing ? (
          <div className="detail-edit-form">
            <div className="modal-input-group">
              <label className="modal-input-label">ひとことメモ（メニュー・店名など）</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例: 親子丼、近所の定食屋、自家製パスタ..."
                className="modal-textarea"
                rows={2}
                autoFocus
              />
            </div>

            <div className="modal-input-group">
              <div className="modal-input-label-row">
                <label className="modal-input-label">タグ</label>
                {selectedTags.length > 0 && (
                  <span className="selected-tags-count">
                    {selectedTags.length}件選択中
                  </span>
                )}
              </div>

              {/* Preset & Custom Tags Chips */}
              <div className="tag-chips">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-chip ${selectedTags.includes(tag) ? "active" : ""}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
                {allCustomTags.map((customTag) => {
                  const isSelected = selectedTags.includes(customTag);
                  return (
                    <button
                      key={customTag}
                      type="button"
                      className={`tag-chip custom-tag-chip ${isSelected ? "active" : ""}`}
                      onClick={() => handleTagToggle(customTag)}
                      title={isSelected ? `タップしてタグ「#${customTag}」を解除` : `タップしてタグ「#${customTag}」を付与`}
                    >
                      <span>#{customTag}</span>
                      {onRemoveCustomTag && (
                        <span
                          className="tag-chip-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelected) {
                              handleTagToggle(customTag);
                            }
                            onRemoveCustomTag(customTag);
                          }}
                          title="タグ候補から削除"
                          role="button"
                          tabIndex={0}
                          aria-label={`タグ「${customTag}」を候補から削除`}
                        >
                          <Icon.Close size={10} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input Row */}
              <div className="custom-tag-input-row" style={{ marginTop: "8px" }}>
                <div className="custom-tag-input-wrap">
                  <span className="custom-tag-prefix">#</span>
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="タグを追加..."
                    className="custom-tag-input"
                    maxLength={20}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddCustomTag()}
                  disabled={!customTagInput.trim()}
                  className="btn-add-custom-tag"
                  title="タグを追加"
                >
                  <Icon.Plus size={13} />
                  <span>追加</span>
                </button>
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
                <Icon.Edit size={16} /> {hasNote || hasTags ? "メモやタグを編集する" : "メモやタグを追加する"}
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
              <Icon.Trash size={16} /> この記録を取り消す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
