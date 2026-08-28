import React from "react";
import { Icon } from "./icons/Icons";

interface HeaderProps {
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export default function Header({ weekLabel, onPrevWeek, onNextWeek }: HeaderProps): React.JSX.Element {
  return (
    <div className="app-header">
      <div className="header-flex">
        <div className="header-title-container">
          <div className="app-title">RATION</div>
          <div className="week-nav">
            <button onClick={onPrevWeek} className="week-nav-btn" aria-label="前の週">
              <Icon.ChevronLeft />
            </button>
            <span className="week-nav-date">{weekLabel}</span>
            <button onClick={onNextWeek} className="week-nav-btn" aria-label="次の週">
              <Icon.ChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Minimalist badging and habits */}
      <div className="badge-list">
        {[
          { icon: <Icon.Fire />, label: "記録 6日連続", bg: "var(--accent-faint)", col: "var(--accent)" },
          { icon: <Icon.Cup />, label: "朝食ログ継続",  bg: "var(--accent-faint)", col: "var(--accent)" },
          { icon: <Icon.BellMini />, label: "リマインド 1件", bg: "var(--accent-faint)", col: "var(--accent)" },
        ].map(({ icon, label, bg, col }) => (
          <div
            key={label}
            className="badge-item"
            style={{ backgroundColor: bg }}
          >
            <span style={{ color: col, display: "inline-flex" }}>{icon}</span>
            <span className="badge-label" style={{ color: col }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
