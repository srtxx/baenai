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
      const compressedDataUrl = await compressImage(file, 800, 800, 0.8);
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
        <div className="modal-title">
          {DAYS[di]}曜日 — {mealLabel}
        </div>
        <div className="modal-subtitle">
          写真または絵文字をタップして即時記録 📸
        </div>

        {/* 写真アップロード（選択したら即登録完了） */}
        <div
          onClick={() => !isCompressing && fileInputRef.current?.click()}
          className="upload-box"
          style={{ cursor: "pointer", marginBottom: "14px" }}
          title="タップして写真を選ぶと即座に記録されます"
        >
          {isCompressing ? (
            <div className="upload-placeholder">
              <div className="loading-spinner" style={{ width: "20px", height: "20px", marginBottom: "8px" }} />
              <span className="upload-text">画像を最適化して保存中...</span>
            </div>
          ) : (
            <div className="upload-placeholder">
              <span className="upload-icon"><Icon.Upload /></span>
              <span className="upload-text" style={{ fontWeight: 600 }}>
                📷 写真を選んで即登録（撮影 or アルバム）
              </span>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <div className="modal-section-divider" style={{ marginBottom: "10px" }}>
          <span>または 絵文字をタップで即記録</span>
        </div>

        {/* ジャンル切り替えタブ */}
        <div className="emoji-category-tabs">
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`emoji-tab-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* 豊富な絵文字グリッドパレット */}
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

        {/* メモ・タグ追加用アコーディオン */}
        <div style={{ marginTop: "10px" }}>
          <button
            type="button"
            className="modal-accordion-toggle"
            onClick={() => setShowNoteSection(prev => !prev)}
          >
            <span>{showNoteSection ? "▲ メモ入力を閉じる" : "▼ ひとことメモやタグも残す"}</span>
          </button>

          {showNoteSection && (
            <div className="modal-optional-section">
              <div className="modal-input-group" style={{ marginBottom: "10px" }}>
                <label className="modal-input-label">
                  選択中のアイコン: <strong style={{ fontSize: "14px" }}>{selectedEmojiForNote}</strong>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="メニュー名やメモなど"
                  className="modal-textarea"
                  rows={2}
                  autoFocus
                />
              </div>

              <div className="modal-input-group" style={{ marginBottom: "12px" }}>
                <label className="modal-input-label">カテゴリー</label>
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
                className="btn-save active"
                style={{ width: "100%", padding: "10px", marginTop: "4px" }}
              >
                メモをつけて保存
              </button>
            </div>
          )}
        </div>

        {/* 閉じるボタン */}
        <div className="btn-group" style={{ marginTop: "14px" }}>
          <button
            onClick={onClose}
            className="btn-cancel"
            style={{ width: "100%" }}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
