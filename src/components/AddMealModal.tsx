import React, { useState, useRef, ChangeEvent } from "react";
import { DAYS, MEAL_LABELS, EMOJI_CATEGORIES } from "../constants";
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
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [showNoteSection, setShowNoteSection] = useState<boolean>(false);
  const [selectedEmojiForNote, setSelectedEmojiForNote] = useState<string>("🍚");
  const [note, setNote] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tagsList = ["自炊", "外食", "コンビニ", "テイクアウト"] as const;

  // 画像選択時に圧縮して即座に保存・クローズ（1クリック登録）
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file, 720, 720, 0.75);
      onSave(di, mi, {
        image: compressedDataUrl,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error("画像圧縮エラー:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          onSave(di, mi, {
            image: reader.result,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
            note: note.trim() || undefined,
          });
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

  // 絵文字をワンタップで即時記録
  const handleQuickEmojiClick = (emoji: string, defaultTag?: string) => {
    if (showNoteSection) {
      // メモ展開中は絵文字を選択状態にする
      setSelectedEmojiForNote(emoji);
      if (defaultTag && !selectedTags.includes(defaultTag)) {
        setSelectedTags(prev => [...prev, defaultTag]);
      }
      return;
    }

    if (emoji === "🌙") {
      onSave(di, mi, { skipped: true });
    } else {
      onSave(di, mi, {
        quickEmoji: emoji,
        tags: defaultTag ? [defaultTag] : undefined,
      });
    }
    onClose();
  };

  // メモセクションからの保存
  const handleSaveWithNote = () => {
    onSave(di, mi, {
      quickEmoji: selectedEmojiForNote,
      note: note.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
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
              写真または絵文字を選んで記録
            </p>
          </div>
          <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
            ✕
          </button>
        </div>

        {/* Top Quick Actions: Photo & Skip */}
        <div className="add-quick-hero-row">
          <div
            onClick={() => !isCompressing && fileInputRef.current?.click()}
            className={`hero-photo-box ${isCompressing ? "compressing" : ""}`}
            title="タップして写真を選ぶと即座に記録されます"
          >
            {isCompressing ? (
              <div className="upload-placeholder">
                <div className="loading-spinner" />
                <span className="upload-text">画像を最適化中...</span>
              </div>
            ) : (
              <div className="hero-photo-inner">
                <span className="hero-camera-icon">📷</span>
                <div className="hero-photo-texts">
                  <span className="hero-photo-title">写真で記録</span>
                  <span className="hero-photo-sub">撮影・ライブラリ</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleQuickEmojiClick("🌙")}
            className="hero-skip-btn"
            title="食べなかった時は休食を記録"
          >
            <span className="hero-skip-icon">🌙</span>
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

        <div className="modal-section-divider">
          <span>または絵文字で記録</span>
        </div>

        {/* Emoji Category Tabs */}
        <div className="emoji-category-tabs">
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`emoji-tab-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="tab-cat-icon">{cat.icon}</span>
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
              className={`emoji-grid-item ${showNoteSection && selectedEmojiForNote === item.emoji ? "active" : ""}`}
              onClick={() => handleQuickEmojiClick(item.emoji, item.defaultTag)}
              title={showNoteSection ? `${item.label} を選択` : `${item.label} をワンタップ記録`}
            >
              <span className="emoji-grid-icon">{item.emoji}</span>
              <span className="emoji-grid-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Note / Tag Accordion */}
        <div className="modal-accordion-wrap">
          <button
            type="button"
            className="modal-accordion-toggle"
            onClick={() => setShowNoteSection(prev => !prev)}
          >
            <span>{showNoteSection ? "▲ メモ入力を閉じる" : "✏️ ひとことメモやタグも残す"}</span>
          </button>

          {showNoteSection && (
            <div className="modal-optional-section">
              <div className="modal-input-group">
                <label className="modal-input-label">
                  選んだ絵文字: <strong className="selected-emoji-badge">{selectedEmojiForNote}</strong>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="メニュー名やひと言メモ..."
                  className="modal-textarea"
                  rows={2}
                  autoFocus
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-input-label">カテゴリータグ</label>
                <div className="tag-chips">
                  {tagsList.map(tag => (
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

              <button
                type="button"
                onClick={handleSaveWithNote}
                className="btn-modal-primary"
              >
                メモをつけて保存
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
