import React from "react";
import { Icon } from "./icons/Icons";

interface BottomNavProps {
  onHomeClick: () => void;
  onAchievementsClick: () => void;
  onCameraClick: () => void;
  onShareClick: () => void;
  onSettingsClick: () => void;
}

export default function BottomNav({
  onHomeClick,
  onAchievementsClick,
  onCameraClick,
  onShareClick,
  onSettingsClick,
}: BottomNavProps): React.JSX.Element {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <button
          type="button"
          onClick={onHomeClick}
          className="nav-item active"
          title="記録"
          aria-label="記録"
        >
          <div className="nav-icon-box">
            <Icon.Log size={20} />
          </div>
          <span className="nav-label">記録</span>
        </button>

        <button
          type="button"
          onClick={onAchievementsClick}
          className="nav-item"
          title="生活リズム"
          aria-label="生活リズム"
        >
          <div className="nav-icon-box">
            <Icon.Leaf size={20} />
          </div>
          <span className="nav-label">生活リズム</span>
        </button>

        <div className="nav-center-action-wrap">
          <button
            type="button"
            onClick={onCameraClick}
            className="nav-primary-btn"
            aria-label="写真で1タップ記録"
            title="写真で1タップ記録"
          >
            <span className="primary-btn-glow" />
            <Icon.Camera size={24} />
          </button>
        </div>

        <button
          type="button"
          onClick={onShareClick}
          className="nav-item"
          title="生存報告"
          aria-label="生存報告"
        >
          <div className="nav-icon-box">
            <Icon.Share size={20} />
          </div>
          <span className="nav-label">生存報告</span>
        </button>

        <button
          type="button"
          onClick={onSettingsClick}
          className="nav-item"
          title="設定"
          aria-label="設定"
        >
          <div className="nav-icon-box">
            <Icon.Settings size={20} />
          </div>
          <span className="nav-label">設定</span>
        </button>
      </div>
    </nav>
  );
}



