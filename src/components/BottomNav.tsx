import React from "react";
import { Icon } from "./icons/Icons";

interface BottomNavProps {
  onCameraClick: () => void;
}

export default function BottomNav({ onCameraClick }: BottomNavProps): React.JSX.Element {
  return (
    <div className="bottom-nav">
      {[
        { icon: <Icon.Log />, lbl: "記録", active: true },
        { icon: <Icon.Friends />, lbl: "仲間", active: false },
        { icon: <Icon.Camera />, lbl: "撮影", active: false, primary: true },
        { icon: <Icon.Bell />, lbl: "リマインド", active: false, badge: true },
        { icon: <Icon.User />, lbl: "プロフ", active: false },
      ].map(({ icon, lbl, active, badge, primary }) => {
        if (primary) {
          return (
            <div
              key={lbl}
              onClick={onCameraClick}
              className="nav-primary-btn"
              aria-label="撮影して記録"
            >
              {icon}
            </div>
          );
        }

        return (
          <div
            key={lbl}
            className={`nav-item ${active ? "active" : ""}`}
          >
            <div className="nav-icon">{icon}</div>
            <div className="nav-label">{lbl}</div>
            {badge && (
              <div className="nav-badge" />
            )}
          </div>
        );
      })}
    </div>
  );
}
