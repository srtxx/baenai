import React from "react";
import { Icon } from "./icons/Icons";
import { Achievement } from "../types";

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

function renderReflectionIcon(iconKey: string): React.JSX.Element {
  switch (iconKey) {
    case "moon":
      return <Icon.Moon size={20} />;
    case "log":
      return <Icon.Camera size={20} />;
    case "fire":
      return <Icon.Pan size={20} />;
    case "leaf":
      return <Icon.Store size={20} />;
    case "sparkle":
      return <Icon.Utensils size={20} />;
    case "calendar":
      return <Icon.Coffee size={20} />;
    default:
      return <Icon.Utensils size={20} />;
  }
}

export default function AchievementsModal({
  achievements,
  onClose
}: AchievementsModalProps): React.JSX.Element {
  const activeItems = achievements.filter((item) => (item.progress?.current || 0) > 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content achievements-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">週の生活リズム</h2>
            <p className="modal-subtitle">
              今週の食卓と休息の波形
            </p>
          </div>
          <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
            <Icon.Close size={18} />
          </button>
        </div>

        {/* Philosophy Message Card */}
        <div className="rhythm-philosophy-card">
          <p className="rhythm-philosophy-quote">
            「きれいに並べなくていい。栄養が偏っていてもいい。今日まで生きた、あなただけの確かな記録。」
          </p>
        </div>

        {/* Life Rhythm Active Cards */}
        {activeItems.length > 0 ? (
          <div className="rhythm-items-list">
            {activeItems.map((item) => (
              <div key={item.id} className="rhythm-flow-card">
                <div className="rhythm-flow-icon">
                  {renderReflectionIcon(item.icon)}
                </div>
                <div className="rhythm-flow-info">
                  <span className="rhythm-flow-title">{item.title}</span>
                  <span className="rhythm-flow-desc">{item.description}</span>
                </div>
                <div className="rhythm-flow-badge">
                  <span>{item.progress?.current} 回</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rhythm-empty-state">
            <div className="rhythm-empty-icon"><Icon.Moon size={32} /></div>
            <p className="rhythm-empty-title">静かな余白の週</p>
            <p className="rhythm-empty-desc">
              記録がない時間も、体を休め、生活が静かに呼吸している大切な証拠です。
            </p>
          </div>
        )}

        <div className="modal-save-action-wrap" style={{ marginTop: "20px" }}>
          <button type="button" onClick={onClose} className="btn-modal-secondary">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
