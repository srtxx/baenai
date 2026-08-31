import React from "react";
import { Icon } from "./icons/Icons";
import { APP_NAME, APP_TAGLINE, DAILY_EPIGRAPHS } from "../constants";
import { DayIndex } from "../types";

interface HeaderProps {
  weekLabel: string;
  isCurrentWeek: boolean;
  currentDayIndex: DayIndex;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onShareClick: () => void;
  onAchievementsClick?: () => void;
  onNotificationsClick?: () => void;
  hasUnreadNudges?: boolean;
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
  currentDayIndex,
  onPrevWeek,
  onNextWeek,
  onToday,
  onShareClick,
  onAchievementsClick,
  onNotificationsClick,
  hasUnreadNudges = false,
  stats,
}: HeaderProps): React.JSX.Element {
  const todayEpigraph = currentDayIndex >= 0 ? DAILY_EPIGRAPHS[currentDayIndex] : DAILY_EPIGRAPHS[0];

  return (
    <div className="app-header">
      <div className="header-flex">
        <div className="header-title-container">
          <div className="app-title-row">
            <div className="brand-wrap">
              <span className="app-title">{APP_NAME}</span>
              <span className="app-tagline">{APP_TAGLINE}</span>
            </div>

            {!isCurrentWeek && (
              <button onClick={onToday} className="today-jump-btn" title="今週に戻る">
                今週
              </button>
            )}

            <div className="header-right-actions">
              {onAchievementsClick && (
                <button
                  onClick={onAchievementsClick}
                  className="header-action-btn"
                  title="ふりかえり"
                  aria-label="ふりかえり"
                >
                  🌿
                </button>
              )}
              {onNotificationsClick && (
                <button
                  onClick={onNotificationsClick}
                  className="header-action-btn"
                  title="届いたことば"
                  aria-label="届いたことば"
                >
                  ✉️
                  {hasUnreadNudges && <span className="header-notif-dot" />}
                </button>
              )}
              <button onClick={onShareClick} className="share-btn" title="今週のmogをシェア" aria-label="シェア">
                <Icon.Share />
              </button>
            </div>
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

      {/* 今日のエピグラフ */}
      <div className="daily-epigraph-banner">
        <span className="epigraph-quote">“{todayEpigraph}”</span>
      </div>

      {/* 静かな数字 */}
      <div className="badge-list">
        <div className="badge-item">
          <span className="badge-label">
            記録 <strong>{stats.photoCount}</strong> / {stats.totalSlots}
          </span>
        </div>
        {stats.skipCount > 0 && (
          <div className="badge-item">
            <span className="badge-label">おやすみ <strong>{stats.skipCount}</strong>食</span>
          </div>
        )}
      </div>
    </div>
  );
}

