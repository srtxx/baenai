import React, { useState, useRef, ChangeEvent } from "react";
import { Icon } from "./icons/Icons";
import { DAYS, MEAL_LABELS, EMOJI_CATEGORIES } from "../constants";
import { DayIndex, MealIndex, Meal } from "../types";
import { compressImage } from "../utils/imageCompressor";

interface AddMealModalProps {
  di: DayIndex;
  mi: MealIndex;
  onClose: () => void;
  onSave: (di: DayIndex, mi: MealIndex, mealData: Meal) => void;
}

const RECENT_EMOJIS_KEY = "mog_recent_emojis";
const DEFAULT_RECENTS = [
  { emoji: "🍚", label: "ごはん" },
  { emoji: "🍙", label: "おにぎり", defaultTag: "コンビニ" },
  { emoji: "🍳", label: "自炊", defaultTag: "自炊" },
  { emoji: "🍜", label: "外食", defaultTag: "外食" },
  { emoji: "☕️", label: "カフェ" },
];

const PRESET_TAGS = ["自炊", "外食", "コンビニ", "テイクアウト", "カフェ", "お弁当"] as const;

export default function AddMealModal({ di, mi, onClose, onSave }: AddMealModalProps): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState<string>("staple");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("🍚");
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recentEmojis, setRecentEmojis] = useState<{ emoji: string; label: string; defaultTag?: string }[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_EMOJIS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_RECENTS;
  });

  const recordRecentEmoji = (emoji: string, label: string, defaultTag?: string) => {
    try {
      const filtered = recentEmojis.filter(r => r.emoji !== emoji);
      const next = [{ emoji, label, defaultTag }, ...filtered].slice(0, 5);
      setRecentEmojis(next);
      localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(next));
    } catch {}
  };

  // 写真選択時：即座にプレビューにセットし、メモ・タグ入力可能にする
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file, 720, 720, 0.75);
      setSelectedImage(compressedDataUrl);
    } catch (err) {
      console.error("画像圧縮エラー:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedImage(reader.result);
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
    setSelectedEmoji(emoji);
    setSelectedImage(null); // 絵文字を選択したら写真プレビューはクリア
    if (defaultTag && !selectedTags.includes(defaultTag)) {
      setSelectedTags(prev => [...prev, defaultTag]);
    }
  };

  // 休食（スキップ）はワンタップで即時記録
  const handleSkipMeal = () => {
    onSave(di, mi, { skipped: true });
    onClose();
  };

  // メイン保存アクション
  const handleSave = () => {
    if (selectedImage) {
      onSave(di, mi, {
        image: selectedImage,
        note: note.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
    } else {
      recordRecentEmoji(selectedEmoji, "食事", selectedTags[0]);
      onSave(di, mi, {
        quickEmoji: selectedEmoji,
        note: note.trim() || undefined,
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
              {selectedImage ? "写真とひとことコメント・タグを残せます" : "写真または絵文字と、メモやタグを残せます"}
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
            title="食べなかった時は休食をワンタップ記録"
          >
            <span className="hero-skip-icon"><Icon.Moon size={20} /></span>
            <div className="hero-skip-texts">
              <span className="hero-skip-title">休食</span>
              <span className="hero-skip-sub">スキップ</span>
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

        {/* If no photo is selected, show emoji selector */}
        {!selectedImage && (
          <div className="modal-emoji-section">
            {/* Recent Emojis */}
            {recentEmojis.length > 0 && (
              <div className="modal-recents-section">
                <div className="modal-recents-header">
                  <Icon.History size={12} />
                  <span>よく使う食事</span>
                </div>
                <div className="modal-recents-row">
                  {recentEmojis.map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      className={`recent-emoji-pill ${selectedEmoji === item.emoji ? "selected" : ""}`}
                      onClick={() => handleEmojiSelect(item.emoji, item.label, item.defaultTag)}
                      title={`${item.label} を選択`}
                    >
                      <span className="recent-emoji-char">{item.emoji}</span>
                      <span className="recent-emoji-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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

        {/* Note & Tag Section (Clean, rich and intuitive) */}
        <div className="modal-unified-note-section">
          <div className="modal-input-group">
            <div className="modal-input-label-row">
              <label className="modal-input-label">
                {selectedImage ? "写真のひとことコメント" : "ひとことメモ（メニュー・店名など）"}
              </label>
              {!selectedImage && (
                <span className="selected-emoji-indicator">
                  選択中: <strong>{selectedEmoji}</strong>
                </span>
              )}
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={selectedImage ? "例: 自家製パスタ、いつもの定食屋、プロテイン..." : "例: 親子丼、近所の定食屋、プロテイン..."}
              className="modal-text-input"
              maxLength={40}
            />
          </div>

          <div className="modal-input-group" style={{ marginBottom: "6px" }}>
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
              {/* Render any non-preset custom tags */}
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

