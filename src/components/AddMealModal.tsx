import React, { useState, useRef, ChangeEvent } from "react";
import { Icon } from "./icons/Icons";
import { DAYS, MEAL_LABELS, EMOJI_CATEGORIES, QUICK_MEAL_OPTIONS, PRESET_TAGS } from "../constants";
import { DayIndex, MealIndex, Meal } from "../types";
import { compressImage } from "../utils/imageCompressor";

interface AddMealModalProps {
  di: DayIndex;
  mi: MealIndex;
  onClose: () => void;
  onSave: (di: DayIndex, mi: MealIndex, mealData: Meal) => void;
}

export default function AddMealModal({ di, mi, onClose, onSave }: AddMealModalProps): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>("staple");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>(QUICK_MEAL_OPTIONS[0].emoji);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 写真選択時：圧縮完了と同時に即時保存してモーダルを閉じる（摩擦ゼロ）
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file, 720, 720, 0.75);
      onSave(di, mi, { image: compressedDataUrl });
      onClose();
    } catch (err) {
      console.error("画像圧縮エラー:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          onSave(di, mi, { image: reader.result });
          onClose();
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTag = customTagInput.trim().replace(/^#+/, "");
    if (!cleanTag) return;
    if (!selectedTags.includes(cleanTag)) {
      setSelectedTags(prev => [...prev, cleanTag]);
    }
    setCustomTagInput("");
  };

  const handleEmojiSelect = (emoji: string, _label: string, defaultTag?: string) => {
    if (!isDetailOpen) {
      // アコーディオンが閉じている時はゼロ摩擦のワンタップ保存
      onSave(di, mi, {
        quickEmoji: emoji,
        tags: defaultTag ? [defaultTag] : undefined,
      });
      onClose();
      return;
    }
    // 詳細入力モードが開いている時は選択状態を保持して編集
    setSelectedEmoji(emoji);
    setSelectedImage(null); // 絵文字を選択したら写真プレビューはクリア
    if (defaultTag && !selectedTags.includes(defaultTag)) {
      setSelectedTags(prev => [...prev, defaultTag]);
    }
  };

  // 休食はワンタップで即時記録
  const handleSkipMeal = () => {
    onSave(di, mi, { skipped: true });
    onClose();
  };

  // メイン保存アクション
  const handleSave = () => {
    if (selectedImage) {
      onSave(di, mi, {
        image: selectedImage,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    } else {
      onSave(di, mi, {
        quickEmoji: selectedEmoji,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    }
    onClose();
  };

  const mealLabel = MEAL_LABELS[mi] || "ごはん";
  const currentCategoryData = EMOJI_CATEGORIES.find(c => c.id === activeCategory) || EMOJI_CATEGORIES[0];

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
              {selectedImage ? "写真で記録を保存" : isDetailOpen ? "タグや食事スタイルを選んで保存" : "タップで即時記録"}
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
              className={`hero-photo-box ${isCompressing ? "compressing" : ""}`}
              title="写真を撮影またはライブラリから選択"
            >
              {isCompressing ? (
                <div className="upload-placeholder">
                  <div className="loading-spinner" />
                  <span className="upload-text">最適化中...</span>
                </div>
              ) : (
                <div className="hero-photo-inner">
                  <span className="hero-camera-icon"><Icon.Camera size={22} /></span>
                  <div className="hero-photo-texts">
                    <span className="hero-photo-title">写真で記録</span>
                    <span className="hero-photo-sub">撮影・選択</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleSkipMeal}
            className="hero-skip-btn"
            title="食事をとらずに体を休めたときは休食をワンタップ記録"
          >
            <span className="hero-skip-icon"><Icon.Moon size={20} /></span>
            <div className="hero-skip-texts">
              <span className="hero-skip-title">休食</span>
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

        {/* If photo is NOT selected: Quick Emoji Options */}
        {!selectedImage && (
          <div className="modal-quick-emojis-section">
            <div className="modal-quick-header">
              <span className="modal-quick-label">定番の食事スタイル</span>
              <span className="selected-emoji-indicator">
                {isDetailOpen ? <>選択中: <strong>{selectedEmoji}</strong></> : "1タップで記録"}
              </span>
            </div>
            <div className="modal-quick-row">
              {QUICK_MEAL_OPTIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`quick-emoji-card ${selectedEmoji === item.emoji && isDetailOpen ? "selected" : ""}`}
                  onClick={() => handleEmojiSelect(item.emoji, item.label, item.defaultTag)}
                  title={`${item.label} を記録`}
                >
                  <span className="quick-emoji-char">{item.emoji}</span>
                  <span className="quick-emoji-label">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Toggle Accordion for Details & Extra Emojis */}
            <button
              type="button"
              className={`btn-toggle-details ${isDetailOpen ? "open" : ""}`}
              onClick={() => setIsDetailOpen(!isDetailOpen)}
            >
              <div className="toggle-details-inner">
                {isDetailOpen ? (
                  <>
                    <Icon.ChevronUp size={15} />
                    <span>閉じる</span>
                  </>
                ) : (
                  <>
                    <Icon.Plus size={13} />
                    <span>タグ・他の食事スタイルを選択</span>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Detail Input Area: Always shown if photo is selected, or conditionally for emoji */}
        {(selectedImage || isDetailOpen) && (
          <div className="modal-expanded-section">
            {/* Tags */}
            <div className="modal-unified-note-section">
              <div className="modal-input-group" style={{ marginBottom: "2px" }}>
                <div className="modal-input-label-row">
                  <label className="modal-input-label">タグ</label>
                  {selectedTags.length > 0 && (
                    <span className="selected-tags-count">
                      {selectedTags.length}件選択中
                    </span>
                  )}
                </div>

                {/* Preset Tags Chips */}
                <div className="tag-chips">
                  {PRESET_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-chip ${selectedTags.includes(tag) ? "active" : ""}`}
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                  {/* Custom Tags */}
                  {selectedTags
                    .filter(t => !PRESET_TAGS.includes(t as typeof PRESET_TAGS[number]))
                    .map(customTag => (
                      <button
                        key={customTag}
                        type="button"
                        className="tag-chip active custom-tag-chip"
                        onClick={() => handleTagToggle(customTag)}
                        title="タップしてタグを解除"
                      >
                        #{customTag}
                        <span className="tag-remove-x">×</span>
                      </button>
                    ))}
                </div>

                {/* Custom Tag Input Row */}
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

            {/* Extra Emojis Palette (Only if photo is not selected) */}
            {!selectedImage && (
              <div className="modal-extra-emojis-section">
                <div className="extra-emojis-header">
                  <Icon.Tag size={12} />
                  <span>他の食事スタンプを探す</span>
                </div>

                {/* Category Tabs */}
                <div className="emoji-category-tabs">
                  {EMOJI_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`emoji-tab-btn ${activeCategory === cat.id ? "active" : ""}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      <span className="tab-cat-name">{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Emoji Grid */}
                <div className="emoji-grid-extended">
                  {currentCategoryData.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`emoji-grid-item ${selectedEmoji === item.emoji ? "selected" : ""}`}
                      onClick={() => handleEmojiSelect(item.emoji, item.label, item.defaultTag)}
                      title={`${item.label} を選択`}
                    >
                      <span className="emoji-grid-icon">{item.emoji}</span>
                      <span className="emoji-grid-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="modal-save-action-wrap">
          <button
            type="button"
            onClick={handleSave}
            className="btn-modal-primary"
          >
            {selectedImage ? "写真で記録を保存" : "記録を保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

