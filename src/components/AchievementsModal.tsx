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
  const percent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content achievements-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">ふりかえりのしるし</h2>
            <p className="modal-subtitle">
              記録のしるし: <strong>{unlockedCount}</strong> / {achievements.length}
            </p>
          </div>
          <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="achievement-progress-bar-wrap">
          <div
            className="achievement-progress-bar-fill"
            style={{ width: `${percent}%` }}
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
                <div className="achievement-title-row">
                  <span className="achievement-title">{item.title}</span>
                  {item.unlocked && <span className="achievement-sparkle">🌱</span>}
                </div>
                <div className="achievement-desc">{item.description}</div>
                {item.unlocked ? (
                  <div className="achievement-date">達成日: {item.unlockedAt}</div>
                ) : item.progress ? (
                  <div className="achievement-progress-text">
                    進行状況: {item.progress.current} / {item.progress.max}
                  </div>
                ) : (
                  <div className="achievement-locked-label">未達成</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
