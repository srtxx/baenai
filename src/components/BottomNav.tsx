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
          title="きろく"
          aria-label="きろく"
        >
          <div className="nav-icon-box">
            <Icon.Log />
          </div>
          <span className="nav-label">きろく</span>
        </button>

        <button
          type="button"
          onClick={onAchievementsClick}
          className="nav-item"
          title="あしあと"
          aria-label="あしあと"
        >
          <div className="nav-icon-box">
            <Icon.Leaf />
          </div>
          <span className="nav-label">あしあと</span>
        </button>

        <div className="nav-center-action-wrap">
          <button
            type="button"
            onClick={onCameraClick}
            className="nav-primary-btn"
            aria-label="mogする（記録する）"
            title="mogする（記録する）"
          >
            <span className="primary-btn-glow" />
            <Icon.Camera />
          </button>
        </div>

        <button
          type="button"
          onClick={onShareClick}
          className="nav-item"
          title="シェア"
          aria-label="シェア"
        >
          <div className="nav-icon-box">
            <Icon.Share />
          </div>
          <span className="nav-label">シェア</span>
        </button>

        <button
          type="button"
          onClick={onSettingsClick}
          className="nav-item"
          title="設定"
          aria-label="設定"
        >
          <div className="nav-icon-box">
            <Icon.Settings />
          </div>
          <span className="nav-label">設定</span>
        </button>
      </div>
    </nav>
  );
}



