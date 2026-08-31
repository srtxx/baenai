import React from "react";
import { Icon } from "./icons/Icons";
import { ActiveTab } from "../types";

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onCameraClick: () => void;
  onSettingsClick: () => void;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onCameraClick,
  onSettingsClick,
}: BottomNavProps): React.JSX.Element {
  return (
    <div className="bottom-nav">
      <div
        onClick={() => onTabChange("home")}
        className={`nav-item ${activeTab === "home" ? "active" : ""}`}
        title="きろく"
      >
        <div className="nav-icon"><Icon.Log /></div>
        <div className="nav-label">きろく</div>
      </div>

      <div
        onClick={() => onTabChange("friends")}
        className={`nav-item ${activeTab === "friends" ? "active" : ""}`}
        title="ともだち"
      >
        <div className="nav-icon">
          <Icon.Friends />
        </div>
        <div className="nav-label">ともだち</div>
      </div>

      <div
        onClick={onCameraClick}
        className="nav-primary-btn"
        aria-label="mogする"
        title="mogする"
      >
        <Icon.Camera />
      </div>

      <div
        onClick={onSettingsClick}
        className="nav-item"
        title="設定"
      >
        <div className="nav-icon"><Icon.Settings /></div>
        <div className="nav-label">設定</div>
      </div>
    </div>
  );
}


