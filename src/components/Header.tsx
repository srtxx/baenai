import React from "react";
import { Icon } from "./icons/Icons";

interface HeaderProps {
  weekLabel: string;
  isCurrentWeek: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  stats: {
    photoCount: number;
    skipCount: number;
    totalLogged: number;
    totalSlots: number;
  };
}

export default function Header({
  weekLabel,
  isCurrentWeek,
  onPrevWeek,
  onNextWeek,
  onToday,
  stats,
}: HeaderProps): React.JSX.Element {
  return (
    <div className="app-header">
      <div className="header-flex">
        <div className="header-title-container">
          <div className="app-title-row">
            <span className="app-title">RATION</span>
            {!isCurrentWeek && (
              <button onClick={onToday} className="today-jump-btn" title="今週に戻る">
                今週
              </button>
            )}
          </div>
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

      {/* 実データ連動のバッジ */}
      <div className="badge-list">
        <div className="badge-item">
          <span className="badge-icon"><Icon.Fire /></span>
          <span className="badge-label">
            記録 {stats.photoCount} / {stats.totalSlots}
          </span>
        </div>
        {stats.skipCount > 0 && (
          <div className="badge-item">
            <span className="badge-icon"><Icon.Cup /></span>
            <span className="badge-label">スキップ {stats.skipCount}食</span>
          </div>
        )}
        <div className="badge-item">
          <span className="badge-icon"><Icon.BellMini /></span>
          <span className="badge-label">
            未記録 {stats.totalSlots - stats.totalLogged}食
          </span>
        </div>
      </div>
    </div>
  );
}

