import React from "react";
import { Icon } from "./icons/Icons";
import { Achievement } from "../types";

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

function renderAchievementIcon(iconKey: string): React.JSX.Element {
  switch (iconKey) {
    case "leaf":
      return <Icon.Leaf size={20} />;
    case "log":
      return <Icon.Log size={20} />;
    case "fire":
      return <Icon.Fire size={20} />;
    case "moon":
      return <Icon.Moon size={20} />;
    case "calendar":
      return <Icon.Calendar size={20} />;
    case "share":
      return <Icon.Share size={20} />;
    case "sparkle":
      return <Icon.Sparkle size={20} />;
    default:
      return <Icon.Leaf size={20} />;
  }
}

export default function AchievementsModal({
  achievements,
  onClose
}: AchievementsModalProps): React.JSX.Element {
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

        {/* Life Rhythm Reflection Grid */}
        <div className="achievement-grid">
          {achievements.map((item) => {
            const count = item.progress?.current || 0;
            return (
              <div
                key={item.id}
                className={`achievement-card ${count > 0 ? "unlocked" : "locked"}`}
              >
                <div className="achievement-icon-wrap">
                  <span className="achievement-icon">{renderAchievementIcon(item.icon)}</span>
                </div>

                <div className="achievement-info">
                  <div className="achievement-title-row">
                    <span className="achievement-title">{item.title}</span>
                  </div>
                  <div className="achievement-desc">{item.description}</div>
                  <div className="rhythm-count-label">
                    {count > 0 ? (
                      <span className="rhythm-count-active">{count} 回の記録</span>
                    ) : (
                      <span className="rhythm-count-empty">今週はなし</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
