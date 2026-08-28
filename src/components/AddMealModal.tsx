import React, { useState, useRef, ChangeEvent } from "react";
import { Icon } from "./icons/Icons";
import { DAYS } from "../constants";
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
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tagsList = ["自炊", "外食", "コンビニ", "惣菜"] as const;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // 長辺800px・WebP/JPEGにリサイズ＆圧縮
      const compressedDataUrl = await compressImage(file, 800, 800, 0.8);
      setImage(compressedDataUrl);
    } catch (err) {
      console.error("画像圧縮エラー:", err);
      // フォールバック: 生のDataURLで読み込み
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

  const handleSave = () => {
    if (!image || isCompressing) return;
    onSave(di, mi, { image, note, tags: selectedTags });
    onClose();
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          {DAYS[di]}曜日 — {mi === 0 ? "朝食" : mi === 1 ? "昼食" : "夕食"}
        </div>
        <div className="modal-subtitle">
          食事の記録
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
              <span className="upload-text">写真をアップロード</span>
            </div>
          )}
        </div>

        {/* メモ入力 */}
        <div className="modal-input-group">
          <label className="modal-input-label">メモ</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="メニューや感想など"
            className="modal-textarea"
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

        {/* スキップボタン */}
        <button
          onClick={() => {
            onSave(di, mi, { skipped: true });
            onClose();
          }}
          className="btn-skip"
        >
          この食事をスキップ（食べなかった）
        </button>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* Buttons */}
        <div className="btn-group">
          <button
            onClick={onClose}
            className="btn-cancel"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!image || isCompressing}
            className={`btn-save ${image && !isCompressing ? "active" : ""}`}
          >
            {isCompressing ? "処理中..." : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
