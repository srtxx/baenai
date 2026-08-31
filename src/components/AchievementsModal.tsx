import React from "react";
import { Achievement } from "../types";

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export default function AchievementsModal({
  achievements,
  onClose
}: AchievementsModalProps): React.JSX.Element {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">ふりかえりの足跡</div>
        <div className="modal-subtitle">
          灯ったきろく: {unlockedCount} / {achievements.length}
        </div>

        {/* Progress Bar */}
        <div className="achievement-progress-bar-wrap">
          <div
            className="achievement-progress-bar-fill"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>

        {/* Badge Grid */}
        <div className="achievement-grid">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`achievement-card ${item.unlocked ? "unlocked" : "locked"}`}
            >
              <div className="achievement-icon-wrap">
                <span className="achievement-icon">{item.icon}</span>
              </div>

              <div className="achievement-info">
                <div className="achievement-title">{item.title}</div>
                <div className="achievement-desc">{item.description}</div>
                {item.unlocked ? (
                  <div className="achievement-date">灯った日: {item.unlockedAt}</div>
                ) : item.progress ? (
                  <div className="achievement-progress-text">
                    {item.progress.current} / {item.progress.max}
                  </div>
                ) : (
                  <div className="achievement-locked-label">静かに待機中</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="btn-cancel" style={{ marginTop: "18px" }}>
          閉じる
        </button>
      </div>
    </div>
  );
}
