import React, { useState, useRef, ChangeEvent } from "react";
import { Icon } from "./icons/Icons";
import { UserProfile } from "../types";
import { compressImage } from "../utils/imageCompressor";

interface SettingsModalProps {
  profile: UserProfile;
  onUpdateProfile: (p: Partial<UserProfile>) => void;
  onClose: () => void;
  onResetAll: () => Promise<void>;
}

export default function SettingsModal({
  profile,
  onUpdateProfile,
  onClose,
  onResetAll,
}: SettingsModalProps): React.JSX.Element {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showCloudSync, setShowCloudSync] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState(profile.name || "");

  // profile.name が外部から変わった場合の同期
  React.useEffect(() => {
    setNameInput(profile.name || "");
  }, [profile.name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNameInput(val);
    onUpdateProfile({ name: val });
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 200, 200, 0.85);
      onUpdateProfile({ avatar: compressed });
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
      <div className="modal-content settings-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">設定</h2>
            <p className="modal-subtitle">mog — たべる、のこす、いきる。</p>
          </div>
          <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
            <Icon.Close />
          </button>
        </div>

        <div className="settings-body">
          {/* Profile Name & Avatar */}
          <div className="settings-card">
            <div className="settings-card-title">プロフィール（週報に表示）</div>
            <div className="settings-profile-row">
              <div
                className="settings-avatar-uploader"
                onClick={() => avatarInputRef.current?.click()}
                title="アイコン写真を変更"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="アバター" className="settings-avatar-img" />
                ) : (
                  <div className="settings-avatar-placeholder">
                    {profile.name ? profile.name.slice(0, 1).toUpperCase() : "U"}
                  </div>
                )}
                <div className="settings-avatar-badge"><Icon.Camera size={13} /></div>
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleAvatarChange}
              />

              <div className="settings-name-field">
                <label className="settings-field-label">おなまえ</label>
                <input
                  type="text"
                  className="modal-text-input"
                  value={nameInput}
                  placeholder="あなたのお名前"
                  onChange={handleNameChange}
                />
              </div>
            </div>
          </div>

          {/* Color Theme Preference */}
          <div className="settings-card">
            <div className="settings-card-title">アプリのカラーテーマ</div>
            <div className="settings-card-desc">画面全体のトーンを選択できます。</div>
            
            <div className="theme-options-grid">
              <button
                type="button"
                className={`theme-card-option ${(!profile.themePreference || profile.themePreference === "ecru") ? "selected" : ""}`}
                onClick={() => onUpdateProfile({ themePreference: "ecru" })}
              >
                <div className="theme-card-swatch ecru-swatch" />
                <div className="theme-card-info">
                  <div className="theme-card-title">
                    <Icon.Leaf size={14} />
                    <span>生成り（エクリュ）</span>
                  </div>
                  <div className="theme-card-sub">あたたかみのあるセージと生成り</div>
                </div>
              </button>

              <button
                type="button"
                className={`theme-card-option ${profile.themePreference === "night" ? "selected" : ""}`}
                onClick={() => onUpdateProfile({ themePreference: "night" })}
              >
                <div className="theme-card-swatch night-swatch" />
                <div className="theme-card-info">
                  <div className="theme-card-title">
                    <Icon.Moon size={14} />
                    <span>ナイト</span>
                  </div>
                  <div className="theme-card-sub">目に優しいダークトーン</div>
                </div>
              </button>
            </div>
          </div>

          {/* Cloud Sync (Supabase) Accordion */}
          <div className="settings-card">
            <div
              className="settings-accordion-header"
              onClick={() => setShowCloudSync(prev => !prev)}
            >
              <div className="settings-accordion-title">
                <span className="settings-accordion-name">
                  <Icon.Cloud size={15} />
                  <span>クラウド同期（Supabase連携）</span>
                </span>
                <span className="settings-accordion-status">任意設定（未設定時は端末内IndexedDBで動作）</span>
              </div>
              <span className={`settings-accordion-arrow ${showCloudSync ? "open" : ""}`}>
                {showCloudSync ? <Icon.ChevronUp size={16} /> : <Icon.ChevronDown size={16} />}
              </span>
            </div>

            {showCloudSync && (
              <div className="settings-accordion-content">
                <div className="settings-field-group">
                  <label className="settings-field-label">Supabase URL</label>
                  <input
                    type="text"
                    className="modal-text-input"
                    value={profile.supabaseUrl || ""}
                    placeholder="https://xxx.supabase.co"
                    onChange={(e) => onUpdateProfile({ supabaseUrl: e.target.value })}
                  />
                </div>
                <div className="settings-field-group" style={{ marginTop: "10px" }}>
                  <label className="settings-field-label">Anon Key</label>
                  <input
                    type="password"
                    className="modal-text-input"
                    value={profile.supabaseKey || ""}
                    placeholder="eyJhbGci..."
                    onChange={(e) => onUpdateProfile({ supabaseKey: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Danger Data Management */}
          <div className="settings-card danger-card">
            <div className="settings-card-title danger-title">データ管理</div>
            {!confirmingReset ? (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="btn-danger-outline"
              >
                <Icon.Trash size={16} />
                <span>全データを初期化（まっさらにする）</span>
              </button>
            ) : (
              <div className="confirm-reset-box">
                <p className="danger-warning">
                  これまでに記録したすべての週の食事が削除されます（設定したお名前やテーマは維持されます）。本当によろしいですか？
                </p>
                <div className="btn-modal-actions-row">
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    disabled={isResetting}
                    className="btn-modal-secondary"
                  >
                    やめる
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isResetting}
                    className="btn-modal-danger"
                  >
                    {isResetting ? "初期化中..." : "初期化を実行"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="btn-modal-actions-row" style={{ marginTop: "18px" }}>
          <button type="button" onClick={onClose} className="btn-modal-secondary">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
