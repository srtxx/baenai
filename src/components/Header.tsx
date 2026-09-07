import React from "react";
import { Icon } from "./icons/Icons";
import { APP_NAME, APP_TAGLINE, DAILY_EPIGRAPHS } from "../constants";
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
  stats,
}: HeaderProps): React.JSX.Element {
  const percentage = Math.round(((stats.photoCount + stats.skipCount) / stats.totalSlots) * 100);
  const todayEpigraph = DAILY_EPIGRAPHS[new Date().getDay() % DAILY_EPIGRAPHS.length];

  return (
    <header className="app-header">
      {/* Brand & Status Row */}
      <div className="header-top-row">
        <div className="brand-group">
          <h1 className="app-title">{APP_NAME}</h1>
          <p className="app-tagline">{APP_TAGLINE}</p>
        </div>

        {!isCurrentWeek && (
          <button onClick={onToday} className="btn-today-pill" title="今週に戻る" aria-label="今週に戻る">
            今週に戻る
          </button>
        )}
      </div>

      {/* Week Navigator */}
      <div className="week-nav-container">
        <button onClick={onPrevWeek} className="week-nav-arrow" aria-label="前の週">
          <Icon.ChevronLeft size={18} />
        </button>
        <div className="week-nav-center">
          <span className="week-nav-calendar-icon"><Icon.Calendar size={14} /></span>
          <span className="week-nav-label">{weekLabel}</span>
        </div>
        <button onClick={onNextWeek} className="week-nav-arrow" aria-label="次の週">
          <Icon.ChevronRight size={18} />
        </button>
      </div>

      {/* Compact Epigraph & Progress Combined Card */}
      <div className="header-summary-card">
        <div className="header-summary-top">
          <span className="epigraph-quote-compact">“{todayEpigraph}”</span>
          <div className="summary-count-badge">
            <strong>{stats.photoCount + stats.skipCount}</strong> / {stats.totalSlots}
          </div>
        </div>
        <div className="stats-progress-bar-bg">
          <div
            className="stats-progress-bar-fill"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </header>
  );
}



