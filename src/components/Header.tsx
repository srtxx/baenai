import React from "react";
import { Icon } from "./icons/Icons";
import { APP_NAME } from "../constants";
import { DayIndex } from "../types";

interface HeaderProps {
  weekLabel: string;
  isCurrentWeek: boolean;
  currentDayIndex?: DayIndex | -1;
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
  currentDayIndex: _currentDayIndex,
  onPrevWeek,
  onNextWeek,
  onToday,
  stats: _stats,
}: HeaderProps): React.JSX.Element {
  return (
    <header className="app-header-slim">
      {/* Top Bar: Brand & Week Nav */}
      <div className="header-slim-main-row">
        <div className="header-slim-brand">
          <span className="brand-logo-text">{APP_NAME}</span>
        </div>

        {/* Week Navigator */}
        <div className="week-nav-slim">
          <button
            onClick={onPrevWeek}
            className="week-nav-btn"
            aria-label="前の週"
            title="前の週"
          >
            <Icon.ChevronLeft size={16} />
          </button>
          <div className="week-nav-label-box" onClick={!isCurrentWeek ? onToday : undefined} title={!isCurrentWeek ? "タップで今週に戻る" : undefined}>
            <span className="week-nav-calendar-icon"><Icon.Calendar size={13} /></span>
            <span className="week-nav-label-text">{weekLabel}</span>
          </div>
          <button
            onClick={onNextWeek}
            className="week-nav-btn"
            aria-label="次の週"
            title="次の週"
          >
            <Icon.ChevronRight size={16} />
          </button>
        </div>

        {!isCurrentWeek && (
          <button
            onClick={onToday}
            className="btn-today-mini"
            title="今週に戻る"
            aria-label="今週に戻る"
          >
            今週
          </button>
        )}
      </div>
    </header>
  );
}




