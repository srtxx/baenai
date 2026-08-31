import React, { useState, useRef, ChangeEvent } from "react";
import { Icon } from "./icons/Icons";
import { DAYS, MEAL_LABELS, QUICK_MEAL_OPTIONS } from "../constants";
import { DayIndex, MealIndex, Meal } from "../types";
import { compressImage } from "../utils/imageCompressor";

interface AddMealModalProps {
  di: DayIndex;
  mi: MealIndex;
  onClose: () => void;
  onSave: (di: DayIndex, mi: MealIndex, mealData: Meal) => void;
}

export default function AddMealModal({ di, mi, onClose, onSave }: AddMealModalProps): React.JSX.Element {
  const [image, setImage] = useState<string>("");
  const [quickEmoji, setQuickEmoji] = useState<string>("🍚");
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tagsList = ["自炊", "外食", "コンビニ", "テイクアウト"] as const;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImage(file, 800, 800, 0.8);
      setImage(compressedDataUrl);
    } catch (err) {
      console.error("画像圧縮エラー:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImage(reader.result);
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

  // ワンタップで即時記録
  const handleQuickSave = (emoji: string, tags: readonly string[]) => {
    onSave(di, mi, {
      quickEmoji: emoji,
      tags: [...tags],
    });
    onClose();
  };

  // 通常保存（写真またはメモ・タグ・絵文字）
  const handleSave = () => {
    if (isCompressing) return;
    onSave(di, mi, {
      image: image || undefined,
      quickEmoji: image ? undefined : quickEmoji,
      note: note.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    onClose();
  };

  const mealLabel = MEAL_LABELS[mi] || "ごはん";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-meal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {DAYS[di]}曜日 — {mealLabel}
        </div>
        <div className="modal-subtitle">
          もぐの記録
        </div>

        {/* ワンタップ記録エリア */}
        <div className="quick-actions-box">
          <div className="quick-actions-label">ワンタップで記録</div>
          <div className="quick-buttons-row">
            {QUICK_MEAL_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className="btn-quick-action"
                onClick={() => handleQuickSave(opt.emoji, opt.tags)}
              >
                <span className="quick-emoji">{opt.emoji}</span>
                <span className="quick-text">{opt.label}</span>
              </button>
            ))}
            <button
              type="button"
              className="btn-quick-action btn-quick-rest"
              onClick={() => {
                onSave(di, mi, { skipped: true });
                onClose();
              }}
              title="この食事はおやすみ"
            >
              <span className="quick-emoji">🌙</span>
              <span className="quick-text">おやすみ</span>
            </button>
          </div>
        </div>

        <div className="modal-section-divider">
          <span>写真やメモを残す場合</span>
        </div>

        {/* Upload Box */}
        <div
          onClick={() => !isCompressing && fileInputRef.current?.click()}
          className="upload-box"
        >
          {isCompressing ? (
            <div className="upload-placeholder">
              <div className="loading-spinner" style={{ width: "20px", height: "20px", marginBottom: "8px" }} />
              <span className="upload-text">画像を最適化中...</span>
            </div>
          ) : image ? (
            <img src={image} alt="プレビュー" className="upload-preview" />
          ) : (
            <div className="upload-placeholder">
              <span className="upload-icon"><Icon.Upload /></span>
              <span className="upload-text">写真を追加（撮影 or アルバム）</span>
            </div>
          )}
        </div>

        {/* 写真がない場合のアイコン選択 */}
        {!image && (
          <div className="modal-input-group" style={{ marginBottom: "12px" }}>
            <label className="modal-input-label">アイコン</label>
            <div className="emoji-picker-row">
              {["🍚", "🥐", "🍙", "🥗", "🍜", "☕️", "🍰"].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setQuickEmoji(em)}
                  className={`btn-emoji-select ${quickEmoji === em ? "active" : ""}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* メモ入力 */}
        <div className="modal-input-group">
          <label className="modal-input-label">ひとこと（なくてもOK）</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="メニューや感想など"
            className="modal-textarea"
            rows={2}
          />
        </div>

        {/* タグ選択 */}
        <div className="modal-input-group">
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

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* Buttons */}
        <div className="btn-group" style={{ marginTop: "16px" }}>
          <button
            onClick={onClose}
            className="btn-cancel"
          >
            閉じる
          </button>
          <button
            onClick={handleSave}
            disabled={isCompressing}
            className="btn-save active"
          >
            {isCompressing ? "処理中..." : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
