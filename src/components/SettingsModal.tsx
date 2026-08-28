import React, { useState } from "react";
import { Icon } from "./icons/Icons";

interface SettingsModalProps {
  onClose: () => void;
  onResetAll: () => Promise<void>;
}

export default function SettingsModal({ onClose, onResetAll }: SettingsModalProps): React.JSX.Element {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
        <div className="modal-title">設定・管理</div>
        <div className="modal-subtitle">RATION — 映えない食事記録</div>

        <div className="settings-section">
          <div className="settings-item-title">使い方</div>
          <p className="settings-desc">
            ・各マスの「＋」をタップして写真を登録します。<br />
            ・食べなかった時は「スキップ」を記録できます。<br />
            ・下部中央のカメラボタンで「今の食事」を素早く記録できます。<br />
            ・写真は自動で圧縮され、この端末内（IndexedDB）に安全に保存されます。
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
