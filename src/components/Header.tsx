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
  onShareClick: () => void;
  onAchievementsClick?: () => void;
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
  onShareClick,
  onAchievementsClick,
  stats,
}: HeaderProps): React.JSX.Element {
  const percentage = Math.round(((stats.photoCount + stats.skipCount) / stats.totalSlots) * 100);
  const todayEpigraph = DAILY_EPIGRAPHS[new Date().getDay() % DAILY_EPIGRAPHS.length];

  return (
    <header className="app-header">
      <div className="header-top-row">
        <div className="brand-group">
          <h1 className="app-title">{APP_NAME}</h1>
          <p className="app-tagline">{APP_TAGLINE}</p>
        </div>

        <div className="header-action-group">
          {!isCurrentWeek && (
            <button onClick={onToday} className="btn-today-pill" title="今週に戻る">
              今週
            </button>
          )}

          {onAchievementsClick && (
            <button
              onClick={onAchievementsClick}
              className="btn-header-action"
              title="振り返り・記録"
              aria-label="振り返り・記録"
            >
              🌿
            </button>
          )}
          <button onClick={onShareClick} className="btn-header-action share-btn" title="週報をシェア" aria-label="シェア">
            <Icon.Share />
          </button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="week-nav-container">
        <button onClick={onPrevWeek} className="week-nav-arrow" aria-label="前の週">
          <Icon.ChevronLeft />
        </button>
        <div className="week-nav-center">
          <span className="week-nav-calendar-icon">🗓️</span>
          <span className="week-nav-label">{weekLabel}</span>
        </div>
        <button onClick={onNextWeek} className="week-nav-arrow" aria-label="次の週">
          <Icon.ChevronRight />
        </button>
      </div>

      {/* Epigraph */}
      <div className="epigraph-card">
        <span className="epigraph-quote">“{todayEpigraph}”</span>
      </div>

      {/* Weekly Progress Card */}
      <div className="weekly-stats-card">
        <div className="stats-info-row">
          <div className="stats-left">
            <span className="stats-title">今週のログ</span>
            <span className="stats-counts">
              記録 <strong>{stats.photoCount}</strong> / {stats.totalSlots}
              {stats.skipCount > 0 && <span className="stats-skip">（休食 {stats.skipCount}）</span>}
            </span>
          </div>
          <div className="stats-percent-pill">{stats.photoCount + stats.skipCount}食</div>
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


