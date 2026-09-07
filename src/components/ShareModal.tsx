import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { Icon } from "./icons/Icons";
import { WeekMeals, ShareRatio, ShareTheme } from "../types";
import { generateShareImage } from "../utils/shareImageGenerator";
import { useProfile } from "../hooks/useProfile";
import { compressImage } from "../utils/imageCompressor";

interface ShareModalProps {
  meals: WeekMeals;
  weekLabel: string;
  stats: { photoCount: number; skipCount: number; totalSlots: number };
  datesList: string[];
  onClose: () => void;
}

export default function ShareModal({
  meals,
  weekLabel,
  stats,
  datesList,
  onClose
}: ShareModalProps): React.JSX.Element {
  const { profile, updateProfile } = useProfile();
  const [ratio, setRatio] = useState<ShareRatio>("4:5");
  const theme: ShareTheme = "ecru"; // 週報は生成り（ecru）に統一
  const [comment, setComment] = useState<string>("今週の食事ログ。なんとか生き延びました");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Debounced image generation when profile, comment, or ratio changes
  useEffect(() => {
    let active = true;
    let url = "";
    setIsGenerating(true);
    
    const timer = setTimeout(async () => {
      try {
        const blob = await generateShareImage(
          meals,
          weekLabel,
          stats,
          datesList,
          profile,
          comment,
          ratio,
          theme
        );
        if (active) {
          setImageBlob(blob);
          url = URL.createObjectURL(blob);
          setObjectUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
          setIsGenerating(false);
        }
      } catch (err) {
        if (active) {
          console.error("Share image generation failed:", err);
          setError("画像の生成に失敗しました");
          setIsGenerating(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [meals, weekLabel, stats, datesList, profile, comment, ratio, theme]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 200, 200, 0.85);
      updateProfile({ avatar: compressed });
    } catch (err) {
      console.error("Avatar compression error:", err);
    }
  };

  const handleShare = async () => {
    if (!imageBlob) return;
    
    if (navigator.share) {
      try {
        const file = new File([imageBlob], "mog_share.png", { type: "image/png" });
        await navigator.share({
          text: `${profile.name} の今週の食事ログ「${comment}」 #mog #たべるのこすいきる`,
          url: "https://mog-app.vercel.app",
          files: [file]
        });
      } catch (err) {
        console.error("シェアに失敗しました", err);
      }
    }
  };

  const handleDownload = () => {
    if (!objectUrl) return;
    const a = document.createElement("a");
    a.href = objectUrl;
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "_");
    a.download = `mog_week_${dateStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content share-modal-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header-row">
            <div>
              <h2 className="modal-title">今週の記録をシェア</h2>
              <p className="modal-subtitle">1週間の食事ログを画像として保存・共有</p>
            </div>
            <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
              <Icon.Close />
            </button>
          </div>

          {/* Ratio Selector */}
          <div className="share-controls-card">
            <div className="share-control-group">
              <span className="modal-input-label">画像サイズ</span>
              <div className="segmented-control">
                {(
                  [
                    { id: "4:5", label: "4:5（標準）" },
                    { id: "9:16", label: "9:16（縦長）" },
                    { id: "1:1", label: "1:1（正方形）" },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRatio(r.id)}
                    className={`segmented-btn ${ratio === r.id ? "active" : ""}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile & Comment Customization Section */}
          <div className="share-customizer-box">
            <div className="share-profile-row">
              <div
                className="share-avatar-uploader"
                onClick={() => avatarInputRef.current?.click()}
                title="アイコンを変更"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="share-avatar-img" />
                ) : (
                  <div className="share-avatar-placeholder">
                    {(profile.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="share-avatar-badge"><Icon.Camera size={13} /></span>
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />

              <div className="share-name-input-wrap">
                <label className="modal-input-label">ユーザー名</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="表示名"
                  className="modal-text-input"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="share-comment-wrap" style={{ marginTop: "10px" }}>
              <label className="modal-input-label">今週のひとこと（画像に刻印）</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="例: 今週は仕事が忙しくて鶏ハムばかり食べてました"
                className="modal-textarea"
                maxLength={60}
                rows={2}
              />
            </div>
          </div>

          {/* Image Preview Container */}
          <div className="share-preview-container">
            {isGenerating && !objectUrl ? (
              <div className="share-generating">
                <div className="loading-spinner" />
                <span>画像を生成中...</span>
              </div>
            ) : error ? (
              <div className="modal-error-text">{error}</div>
            ) : (
              <div
                className="share-preview-wrapper"
                onClick={() => setIsZoomed(true)}
                title="タップして拡大表示"
              >
                <img src={objectUrl!} alt="Share Preview" className="share-preview-image" />
                <div className="share-preview-zoom-hint"><Icon.Search size={14} /> タップで拡大</div>
                {isGenerating && (
                  <div className="share-preview-updating-badge">更新中...</div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="btn-modal-actions-row" style={{ marginTop: "16px" }}>
            {objectUrl && !error && (
              <>
                {canShare && (
                  <button type="button" onClick={handleShare} className="btn-modal-primary">
                    <Icon.Share size={18} /> シェアする
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownload}
                  className={canShare ? "btn-modal-secondary" : "btn-modal-primary"}
                >
                  <Icon.Download size={18} /> 画像を保存
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomed && objectUrl && (
        <div className="lightbox-overlay" onClick={() => setIsZoomed(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={objectUrl} alt="Zoomed Share Preview" className="lightbox-image" />
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setIsZoomed(false)}
            >
              <Icon.Close size={18} /> 閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}

