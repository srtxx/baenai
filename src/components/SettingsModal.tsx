import React, { useState, useRef, ChangeEvent } from "react";
import { Icon } from "./icons/Icons";
import { useProfile } from "../hooks/useProfile";
import { compressImage } from "../utils/imageCompressor";

interface SettingsModalProps {
  onClose: () => void;
  onResetAll: () => Promise<void>;
}

export default function SettingsModal({ onClose, onResetAll }: SettingsModalProps): React.JSX.Element {
  const { profile, updateProfile } = useProfile();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetAll();
      onClose();
    } catch (e) {
      console.error("Reset failed", e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">設定</div>
        <div className="modal-subtitle">mog — たべる、のこす、いきる。</div>

        {/* Profile Section */}
        <div className="settings-section">
          <div className="settings-item-title">プロフィール（週報に表示）</div>
          <div className="share-profile-row" style={{ marginTop: "10px", marginBottom: 0 }}>
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
              <span className="share-avatar-badge">📷</span>
            </div>
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />

            <div className="share-name-input-wrap">
              <label className="share-input-label">おなまえ</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="表示名"
                className="share-name-input"
                maxLength={20}
              />
            </div>
          </div>
        </div>

        {/* Theme Preference Section */}
        <div className="settings-section">
          <div className="settings-item-title">カラーテーマ</div>
          <p className="settings-desc" style={{ marginBottom: "8px" }}>
            就寝前や暗い場所でも見やすい「ナイト」テーマを選べます。
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className={`btn-tag ${(profile.themePreference || "ecru") === "ecru" ? "selected" : ""}`}
              onClick={() => updateProfile({ themePreference: "ecru" })}
              style={{ flex: 1, padding: "8px 12px", justifyContent: "center", cursor: "pointer" }}
            >
              🌿 エクリュ（通常）
            </button>
            <button
              type="button"
              className={`btn-tag ${profile.themePreference === "night" ? "selected" : ""}`}
              onClick={() => updateProfile({ themePreference: "night" })}
              style={{ flex: 1, padding: "8px 12px", justifyContent: "center", cursor: "pointer" }}
            >
              🌙 ナイト（夜）
            </button>
          </div>
        </div>

        {/* Cloud Sync (Supabase) Section */}
        <div className="settings-section">
          <div className="settings-item-title">クラウド同期（Supabase連携）</div>
          <p className="settings-desc" style={{ marginBottom: "10px" }}>
            Supabaseの情報を設定すると、ともだちとのリアルタイム同期が有効になります（未設定時は端末内IndexedDBで動作）。
          </p>
          <div className="supabase-input-group">
            <label className="share-input-label">Project URL</label>
            <input
              type="text"
              value={profile.supabaseUrl || ""}
              onChange={(e) => updateProfile({ supabaseUrl: e.target.value })}
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              className="share-name-input"
              style={{ fontSize: "11.5px", marginBottom: "8px" }}
            />
            <label className="share-input-label">Anon Key</label>
            <input
              type="password"
              value={profile.supabaseKey || ""}
              onChange={(e) => updateProfile({ supabaseKey: e.target.value })}
              placeholder="eyJhbGciOi..."
              className="share-name-input"
              style={{ fontSize: "11.5px" }}
            />
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-item-title">mogについて</div>
          <p className="settings-desc">
            ・各マスをタップしてワンタップ、または写真・メモを記録します。<br />
            ・食べなかった時は「おやすみ」を静かに記録できます。<br />
            ・「ともだち」タブで、同じ時間を生きている仲間にやさしいことばを送れます。<br />
            ・右上のシェアボタンから今週のmog画像を生成・共有できます。
          </p>
        </div>

        <div className="settings-section danger-section">
          <div className="settings-item-title danger-title">データ管理</div>
          {!confirmingReset ? (
            <button
              onClick={() => setConfirmingReset(true)}
              className="btn-danger-outline"
            >
              <Icon.Trash />
              <span>全データを初期化（まっさらにする）</span>
            </button>
          ) : (
            <div className="confirm-reset-box">
              <p className="danger-warning">
                これまでに記録したすべての週の食事が削除されます。本当によろしいですか？
              </p>
              <div className="btn-group">
                <button
                  onClick={() => setConfirmingReset(false)}
                  disabled={isResetting}
                  className="btn-cancel"
                >
                  やめる
                </button>
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="btn-danger-solid"
                >
                  {isResetting ? "初期化中..." : "初期化を実行"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="btn-group" style={{ marginTop: "20px" }}>
          <button onClick={onClose} className="btn-close">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
