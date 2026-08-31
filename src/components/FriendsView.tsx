import React, { useState } from "react";
import { Friend, DayIndex, MealIndex, ReactionType, Encouragement, EncourageType } from "../types";
import { Icon } from "./icons/Icons";
import { ENCOURAGE_MESSAGES } from "../constants";

interface FriendsViewProps {
  friends: Friend[];
  encouragements?: Encouragement[];
  currentDayIndex: DayIndex;
  currentMealIndex: MealIndex;
  myFriendCode: string;
  onOpenAddFriend: () => void;
  onOpenNotifications: () => void;
  onSendEncouragement: (friendId: string, type: EncourageType) => void;
  onSendReaction: (mealSlotKey: string, type: ReactionType) => void;
}

export default function FriendsView({
  friends,
  encouragements = [],
  currentDayIndex,
  currentMealIndex,
  myFriendCode,
  onOpenAddFriend,
  onOpenNotifications,
  onSendEncouragement,
  onSendReaction
}: FriendsViewProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<"companions" | "timeline">("companions");
  const [selectedFriendForMsg, setSelectedFriendForMsg] = useState<string | null>(null);

  // 最新の届いたことば
  const latestEncouragement = encouragements[0];

  return (
    <div className="friends-view-container">
      {/* Header */}
      <div className="friends-header">
        <div>
          <div className="app-title-row" style={{ justifyContent: "flex-start" }}>
            <span className="app-title">ともだち</span>
            <span className="friends-badge">（{friends.length}人）</span>
          </div>
          <div className="friends-subtitle">同じ時間を生きている人たち</div>
        </div>

        <div className="friends-header-actions">
          <button
            onClick={onOpenNotifications}
            className="btn-notif-bell"
            title="届いたことば"
          >
            ✉️
            {encouragements.length > 0 && <span className="notif-dot" />}
          </button>
          <button onClick={onOpenAddFriend} className="btn-add-friend-top" title="ともだち追加">
            <Icon.Plus /> 追加
          </button>
        </div>
      </div>

      {/* Received Encouragement Notice Banner */}
      {latestEncouragement && (
        <div className="nudge-alert-banner" onClick={onOpenNotifications}>
          <span className="nudge-alert-icon">🌱</span>
          <div className="nudge-alert-text">
            <strong>{latestEncouragement.senderName}</strong> から「{latestEncouragement.message}」が届いています
          </div>
          <span className="nudge-alert-arrow">見る →</span>
        </div>
      )}

      {/* View Mode Switcher */}
      <div className="social-view-mode-tabs">
        <button
          onClick={() => setViewMode("companions")}
          className={`social-mode-btn ${viewMode === "companions" ? "active" : ""}`}
        >
          🌿 ともだちの様子
        </button>
        <button
          onClick={() => setViewMode("timeline")}
          className={`social-mode-btn ${viewMode === "timeline" ? "active" : ""}`}
        >
          📰 最近のmog
        </button>
      </div>

      {viewMode === "companions" ? (
        <div className="companions-list-wrap">
          {friends.length === 0 ? (
            <div className="companion-empty-state">
              <span className="empty-leaf">🌱</span>
              <p>まだともだちがいません。<br />コードを共有して、ゆるくつながりましょう。</p>
              <button onClick={onOpenAddFriend} className="btn-add-friend-primary">
                コードを共有する
              </button>
            </div>
          ) : (
            friends.map((friend) => {
              const isSelected = selectedFriendForMsg === friend.id;

              return (
                <div key={friend.id} className="companion-item-card">
                  <div className="companion-card-main">
                    <div className="companion-avatar-box">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="avatar-img" />
                      ) : (
                        <div className="avatar-placeholder">
                          {friend.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="companion-info-box">
                      <div className="companion-name-row">
                        <span className="companion-name">{friend.name}</span>
                      </div>
                      <div className="companion-active-sub">
                        {friend.lastActiveAt ? `${friend.lastActiveAt}に記録` : "静かに過ごしています"}
                      </div>
                    </div>

                    {/* 今日 3食の静かなドット */}
                    <div className="companion-day-dots" title="今日の朝・昼・夜">
                      {(["breakfast", "lunch", "dinner"] as const).map((slot, idx) => {
                        const st = friend.todayStatus[slot];
                        return (
                          <div
                            key={slot}
                            className={`companion-slot-dot ${st === "logged" ? "filled" : st === "skipped" ? "rested" : "empty"}`}
                            title={`${idx === 0 ? "朝" : idx === 1 ? "昼" : "夜"}: ${st === "logged" ? "記録済み" : st === "skipped" ? "おやすみ" : "これから"}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* 送信ボタン or メッセージパレット */}
                  <div className="companion-action-row">
                    {!isSelected ? (
                      <button
                        onClick={() => setSelectedFriendForMsg(friend.id)}
                        className="btn-send-encourage-toggle"
                      >
                        🍵 ことばを送る
                      </button>
                    ) : (
                      <div className="encourage-palette">
                        <div className="palette-title">やさしいことばを送る:</div>
                        <div className="encourage-chips">
                          {ENCOURAGE_MESSAGES.map((msg) => {
                            const typeMap: Record<string, EncourageType> = {
                              "おつかれさま": "otsukare",
                              "えらい": "erai",
                              "ゆるくいこう": "yuruku",
                              "今日も最高": "saikou",
                              "一緒にがんばろ": "ganbarou",
                              "おなかすいた": "onaka",
                            };
                            const type = typeMap[msg.label] || "otsukare";
                            return (
                              <button
                                key={msg.label}
                                onClick={() => {
                                  onSendEncouragement(friend.id, type);
                                  setSelectedFriendForMsg(null);
                                }}
                                className="btn-encourage-chip"
                              >
                                {msg.emoji} {msg.label}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setSelectedFriendForMsg(null)}
                          className="btn-palette-close"
                        >
                          閉じる
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Timeline Feed Mode */
        <div className="feed-list-wrap">
          {friends.map((friend) => {
            // 直近の記録された食事を探す
            let latestMeal: { di: DayIndex; mi: MealIndex; meal: import("../types").Meal } | null = null;
            for (let di = 6; di >= 0; di--) {
              for (let mi = 2; mi >= 0; mi--) {
                const m = friend.meals[di]?.[mi];
                if (m && (("image" in m && m.image) || ("quickEmoji" in m && m.quickEmoji) || ("note" in m && m.note))) {
                  latestMeal = { di: di as DayIndex, mi: mi as MealIndex, meal: m };
                  break;
                }
              }
              if (latestMeal) break;
            }

            if (!latestMeal || !latestMeal.meal) return null;

            const mealTitle = `${latestMeal.mi === 0 ? "あさごはん" : latestMeal.mi === 1 ? "ひるごはん" : "よるごはん"}`;
            const slotKey = `feed_${friend.id}_${latestMeal.di}_${latestMeal.mi}`;
            const m = latestMeal.meal;

            return (
              <div key={friend.id} className="feed-card">
                <div className="feed-card-header">
                  <div className="feed-avatar">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} className="avatar-img" />
                    ) : (
                      <div className="avatar-placeholder">{friend.name.slice(0, 1).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="feed-user-info">
                    <div className="feed-user-name">{friend.name}</div>
                    <div className="feed-time-label">
                      {mealTitle} ・ {friend.lastActiveAt || "今日"}
                    </div>
                  </div>
                </div>

                {"image" in m && m.image ? (
                  <div className="feed-image-wrap">
                    <img src={m.image} alt="食事" className="feed-main-image" />
                  </div>
                ) : "quickEmoji" in m && m.quickEmoji ? (
                  <div className="feed-emoji-wrap">
                    <span className="feed-large-emoji">{m.quickEmoji}</span>
                  </div>
                ) : null}

                {"note" in m && m.note && (
                  <div className="feed-note">💬 {m.note}</div>
                )}

                <div className="feed-reaction-bar">
                  <button
                    onClick={() => onSendReaction(slotKey, "otsukare")}
                    className="feed-stamp-btn"
                  >
                    🍵 おつかれさま
                  </button>
                  <button
                    onClick={() => onSendReaction(slotKey, "erai")}
                    className="feed-stamp-btn"
                  >
                    👏 えらい
                  </button>
                  <button
                    onClick={() => onSendReaction(slotKey, "yuruku")}
                    className="feed-stamp-btn"
                  >
                    🌿 ゆるくいこう
                  </button>
                  <button
                    onClick={() => onSendReaction(slotKey, "oishisou")}
                    className="feed-stamp-btn"
                  >
                    🤤 おいしそう
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

