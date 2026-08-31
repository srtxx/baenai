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
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <button
          type="button"
          onClick={() => onTabChange("home")}
          className={`nav-item ${activeTab === "home" ? "active" : ""}`}
          title="きろく"
          aria-label="きろく"
        >
          <div className="nav-icon-box">
            <Icon.Log />
            {activeTab === "home" && <span className="nav-active-pill" />}
          </div>
          <span className="nav-label">きろく</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("friends")}
          className={`nav-item ${activeTab === "friends" ? "active" : ""}`}
          title="ともだち"
          aria-label="ともだち"
        >
          <div className="nav-icon-box">
            <Icon.Friends />
            {activeTab === "friends" && <span className="nav-active-pill" />}
          </div>
          <span className="nav-label">ともだち</span>
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


