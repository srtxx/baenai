import React from "react";
import { Icon } from "./icons/Icons";

interface BottomNavProps {
  onCameraClick: () => void;
  onSettingsClick: () => void;
}

export default function BottomNav({ onCameraClick, onSettingsClick }: BottomNavProps): React.JSX.Element {
  return (
    <div className="bottom-nav">
      <div className="nav-item active" title="週間記録一覧">
        <div className="nav-icon"><Icon.Log /></div>
        <div className="nav-label">記録</div>
      </div>

      <div
        onClick={onCameraClick}
        className="nav-primary-btn"
        aria-label="撮影して記録"
        title="今の食事を記録"
      >
        <Icon.Camera />
      </div>

      <div
        onClick={onSettingsClick}
        className="nav-item"
        title="設定・データ管理"
      >
        <div className="nav-icon"><Icon.Settings /></div>
        <div className="nav-label">設定</div>
      </div>
    </div>
  );
}

