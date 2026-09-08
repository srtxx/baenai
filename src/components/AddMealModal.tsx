import React, { useState, useRef, useMemo, ChangeEvent } from "react";
import { Icon } from "./icons/Icons";
import { DAYS, MEAL_LABELS, QUICK_MEAL_OPTIONS, PRESET_TAGS, QuickMealOption } from "../constants";
import { DayIndex, MealIndex, Meal } from "../types";
import { compressImage } from "../utils/imageCompressor";

interface AddMealModalProps {
  di: DayIndex;
  mi: MealIndex;
  onClose: () => void;
  onSave: (di: DayIndex, mi: MealIndex, mealData: Meal) => void;
  customTags?: string[];
  onAddCustomTag?: (tag: string) => string | null;
  onRemoveCustomTag?: (tag: string) => void;
}

function renderStyleIcon(icon: QuickMealOption["icon"], size = 22): React.JSX.Element {
  switch (icon) {
    case "pan":
      return <Icon.Pan size={size} />;
    case "store":
      return <Icon.Store size={size} />;
    case "utensils":
      return <Icon.Utensils size={size} />;
    case "coffee":
      return <Icon.Coffee size={size} />;
    case "takeout":
      return <Icon.Takeout size={size} />;
    default:
      return <Icon.Utensils size={size} />;
  }
}

export default function AddMealModal({
  di,
  mi,
  onClose,
  onSave,
  customTags = [],
  onAddCustomTag,
  onRemoveCustomTag,
}: AddMealModalProps): React.JSX.Element {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<QuickMealOption>(QUICK_MEAL_OPTIONS[0]);
  const [note, setNote] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([QUICK_MEAL_OPTIONS[0].defaultTag]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 写真選択時：圧縮完了と同時に即時保存してモーダルを閉じる（1アクション記録）
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file, 720, 720, 0.75);
      if (isDetailOpen) {
        setSelectedImage(compressedDataUrl);
      } else {
        onSave(di, mi, { image: compressedDataUrl });
        onClose();
      }
    } catch (err) {
      console.error("画像圧縮エラー:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          if (isDetailOpen) {
            setSelectedImage(reader.result);
          } else {
            onSave(di, mi, { image: reader.result });
            onClose();
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

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

  // 1クリック保存（生活スタイル選択）
  const handleSelectStyle = (opt: QuickMealOption) => {
    if (!isDetailOpen) {
      // 摩擦ゼロ：タップした瞬間に保存して完了
      onSave(di, mi, {
        style: opt.id as "cook" | "store" | "out" | "cafe" | "takeout",
        iconKey: opt.icon,
        tags: [opt.defaultTag],
      });
      onClose();
      return;
    }
    setSelectedOption(opt);
    setSelectedImage(null);
    if (!selectedTags.includes(opt.defaultTag)) {
      setSelectedTags((prev) => [...prev, opt.defaultTag]);
    }
  };

  // 休食はワンタップで即時記録（1クリック記録）
  const handleSkipMeal = () => {
    onSave(di, mi, { skipped: true });
    onClose();
  };

  // メモや詳細タグを含む保存アクション（メモモード時のみ）
  const handleDetailSave = () => {
    if (selectedImage) {
      onSave(di, mi, {
        image: selectedImage,
        note: note.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    } else {
      onSave(di, mi, {
        style: selectedOption.id as "cook" | "store" | "out" | "cafe" | "takeout",
        iconKey: selectedOption.icon,
        note: note.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    }
    onClose();
  };

  const mealLabel = MEAL_LABELS[mi] || "ごはん";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-meal-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">
              {DAYS[di]}曜日 — {mealLabel}
            </h2>
            <p className="modal-subtitle">
              {isDetailOpen ? "メモやタグを添えて記録" : "選ぶだけで即座に記録完了"}
            </p>
          </div>
          <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
            <Icon.Close size={18} />
          </button>
        </div>

        {/* Top Action Row: Photo Box & Skip Button */}
        <div className="add-quick-hero-row">
          {selectedImage ? (
            <div className="hero-photo-preview-box">
              <img src={selectedImage} alt="選択した写真" className="hero-photo-preview-img" />
              <div className="hero-photo-preview-overlay">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-photo-reselect"
                  title="写真を変更"
                >
                  <Icon.Camera size={13} /> 変更
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="btn-photo-remove"
                  title="写真を削除"
                >
                  <Icon.Close size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !isCompressing && fileInputRef.current?.click()}
              className={`hero-photo-box ${isCompressing ? "compressing" : ""} ${!isDetailOpen ? "instant-hero-btn" : ""}`}
              title="写真を撮影またはライブラリから選択して即時記録"
            >
              {isCompressing ? (
                <div className="upload-placeholder">
                  <div className="loading-spinner" />
                  <span className="upload-text">最適化中...</span>
                </div>
              ) : (
                <div className="hero-photo-inner">
                  <span className="hero-camera-icon"><Icon.Camera size={24} /></span>
                  <div className="hero-photo-texts">
                    <span className="hero-photo-title">写真で即記録</span>
                    <span className="hero-photo-sub">{isDetailOpen ? "撮影・選択" : "1タップで完了"}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleSkipMeal}
            className={`hero-skip-btn ${!isDetailOpen ? "instant-hero-btn" : ""}`}
            title="食事をとらずに体を休めたときは休食をワンタップ記録"
          >
            <span className="hero-skip-icon"><Icon.Moon size={22} /></span>
            <div className="hero-skip-texts">
              <span className="hero-skip-title">休食で即記録</span>
              <span className="hero-skip-sub">体を休める</span>
            </div>
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* Quick Style Options */}
        <div className="modal-quick-emojis-section">
          <div className="modal-quick-header">
            <span className="modal-quick-label">
              {isDetailOpen ? "生活スタイル（タグ）" : "ワンタップ即時記録"}
            </span>
            <span className="selected-emoji-indicator">
              {isDetailOpen ? `選択中: ${selectedOption.label}` : "押した瞬間に保存"}
            </span>
          </div>
          <div className="modal-quick-row">
            {QUICK_MEAL_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`quick-emoji-card ${selectedOption.id === item.id && isDetailOpen ? "selected" : ""} ${!isDetailOpen ? "instant-record-btn" : ""}`}
                onClick={() => handleSelectStyle(item)}
                title={`${item.label} をワンタップで即記録`}
              >
                <span className="quick-emoji-char">{renderStyleIcon(item.icon, 24)}</span>
                <span className="quick-emoji-label">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Detail Mode Toggle */}
          <button
            type="button"
            className={`btn-toggle-details ${isDetailOpen ? "open" : ""}`}
            onClick={() => setIsDetailOpen(!isDetailOpen)}
          >
            <div className="toggle-details-inner">
              {isDetailOpen ? (
                <>
                  <Icon.ChevronUp size={15} />
                  <span>メモ入力を閉じる</span>
                </>
              ) : (
                <>
                  <Icon.Edit size={13} />
                  <span>ひとことメモやタグを添えて記録する</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Detail Input Area (Only displayed when toggled open) */}
        {isDetailOpen && (
          <div className="modal-expanded-section">
            {/* Note input */}
            <div className="modal-unified-note-section">
              <div className="modal-input-group">
                <label className="modal-input-label">ひとことメモ（任意）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例: 近所の定食屋、手作りオムライス"
                  className="modal-note-input"
                  maxLength={60}
                />
              </div>

              {/* Tags */}
              <div className="modal-input-group" style={{ marginTop: "12px" }}>
                <div className="modal-input-label-row">
                  <label className="modal-input-label">タグ</label>
                  {selectedTags.length > 0 && (
                    <span className="selected-tags-count">
                      {selectedTags.length}件選択中
                    </span>
                  )}
                </div>

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

                <div className="custom-tag-input-row">
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
                      placeholder="タグを自由に追加..."
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
            </div>

            {/* Save Button (Only displayed when detail mode is open) */}
            <div className="modal-save-action-wrap">
              <button
                type="button"
                onClick={handleDetailSave}
                className="btn-modal-primary"
              >
                メモを添えて記録を保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

