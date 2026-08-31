import React, { useState } from "react";
import { Friend, DayIndex, MealIndex, ReactionType } from "../types";
import { DAYS } from "../constants";

interface FriendGridModalProps {
  friend: Friend;
  datesList: string[];
  onClose: () => void;
  onSendReaction: (mealSlotKey: string, type: ReactionType) => void;
}

interface FloatingParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

export default function FriendGridModal({
  friend,
  datesList,
  onClose,
  onSendReaction
}: FriendGridModalProps): React.JSX.Element {
  const [selectedCell, setSelectedCell] = useState<{ di: DayIndex; mi: MealIndex } | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  const selectedMeal = selectedCell ? friend.meals[selectedCell.di]?.[selectedCell.mi] : null;
  const slotKey = selectedCell ? `friend_${friend.id}_${selectedCell.di}_${selectedCell.mi}` : "";

  // フレンドの統計・称号計算
  const stats = (() => {
    let photos = 0;
    let skips = 0;
    let cooks = 0;
    let convs = 0;
    friend.meals.forEach((d) =>
      d.forEach((m) => {
        if (m) {
          if ("image" in m && m.image) photos++;
          if ("skipped" in m && m.skipped) skips++;
          if ("tags" in m && m.tags) {
            if (m.tags.includes("自炊")) cooks++;
            if (m.tags.includes("コンビニ")) convs++;
          }
        }
      })
    );

    const title =
      cooks >= 5
        ? "🍳 丁寧な暮らし（仮）"
        : convs >= 4
        ? "🏪 コンビニの亡霊"
        : skips >= 3
        ? "⏳ 省エネサバイバー"
        : "💪 ストイック食事兵士";

    return { photos, skips, cooks, convs, title };
  })();

  const triggerReactionWithBurst = (e: React.MouseEvent<HTMLButtonElement>, type: ReactionType, emoji: string) => {
    onSendReaction(slotKey, type);

    const rect = e.currentTarget.getBoundingClientRect();
    const newParticles: FloatingParticle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      emoji,
      x: rect.left + rect.width / 2 + (Math.random() * 40 - 20),
      y: rect.top - 10 - Math.random() * 20,
    }));

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content friend-grid-modal" onClick={(e) => e.stopPropagation()}>
        {/* Floating Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="floating-reaction-particle"
            style={{ left: `${p.x}px`, top: `${p.y}px` }}
          >
            {p.emoji}
          </div>
        ))}

        {/* Header */}
        <div className="friend-grid-header">
          <div className="friend-grid-profile">
            <div className="friend-grid-avatar">
              {friend.avatar ? (
                <img src={friend.avatar} alt={friend.name} className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {friend.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="friend-grid-name-row">
                <span className="friend-grid-name">{friend.name}</span>
                {friend.currentStreak && (
                  <span className="streak-badge-modal">🔥 {friend.currentStreak}週連続</span>
                )}
              </div>
              <div className="friend-personality-badge">{stats.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="friend-grid-close-btn" aria-label="閉じる">
            ✕
          </button>
        </div>

        {/* Weekly Stats Summary Bar */}
        <div className="friend-grid-stats-bar">
          <span>📸 記録: <strong>{stats.photos}/21</strong></span>
          <span>⏭ 欠食: <strong>{stats.skips}食</strong></span>
          <span>🍳 自炊: <strong>{stats.cooks}回</strong></span>
        </div>

        {/* Column Labels */}
        <div className="column-labels" style={{ marginTop: "12px" }}>
          <div className="column-label-spacer" />
          {["朝", "昼", "夜"].map((m) => (
            <div key={m} className="column-label">{m}</div>
          ))}
        </div>

        {/* 7x3 Grid */}
        <div className="meal-grid" style={{ marginBottom: "16px" }}>
          {friend.meals.map((dayMeals, di) => {
            const dayIndex = di as DayIndex;
            return (
              <div key={di} className="day-row">
                <div className="day-info">
                  <div className={`day-name ${di === 5 ? "saturday" : di === 6 ? "sunday" : ""}`}>
                    {DAYS[dayIndex]}
                  </div>
                  <div className="day-date">{datesList[di] || ""}</div>
                </div>

                {dayMeals.map((meal, mi) => {
                  const mealIndex = mi as MealIndex;
                  const isSelected = selectedCell?.di === di && selectedCell?.mi === mi;

                  if (!meal) {
                    return (
                      <div
                        key={mi}
                        className={`meal-cell meal-cell-empty ${isSelected ? "selected-slot" : ""}`}
                        onClick={() => setSelectedCell({ di: dayIndex, mi: mealIndex })}
                      >
                        <span className="plus-icon">—</span>
                      </div>
                    );
                  }

                  if ("skipped" in meal && meal.skipped) {
                    return (
                      <div
                        key={mi}
                        className={`meal-cell meal-cell-rested ${isSelected ? "selected-slot" : ""}`}
                        onClick={() => setSelectedCell({ di: dayIndex, mi: mealIndex })}
                      >
                        <span className="rested-mark">—</span>
                      </div>
                    );
                  }

                  if ("quickEmoji" in meal && meal.quickEmoji && !("image" in meal && meal.image)) {
                    return (
                      <div
                        key={mi}
                        className={`meal-cell meal-cell-emoji ${isSelected ? "selected-slot" : ""}`}
                        onClick={() => setSelectedCell({ di: dayIndex, mi: mealIndex })}
                      >
                        <span className="cell-emoji-char">{meal.quickEmoji}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={mi}
                      className={`meal-cell meal-cell-filled ${isSelected ? "selected-slot" : ""}`}
                      onClick={() => setSelectedCell({ di: dayIndex, mi: mealIndex })}
                    >
                      {"image" in meal && meal.image && !meal.image.startsWith("http") ? (
                        <img src={meal.image} alt="食事" className="meal-cell-image" />
                      ) : (
                        <span className="cell-emoji-char">🍚</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Selected Meal Detail & Reaction Stamps */}
        {selectedCell && (
          <div className="friend-meal-detail-box">
            <div className="friend-meal-detail-title">
              {DAYS[selectedCell.di]}曜日 {selectedCell.mi === 0 ? "朝食" : selectedCell.mi === 1 ? "昼食" : "夕食"}
            </div>

            {selectedMeal && "image" in selectedMeal && selectedMeal.image ? (
              <div>
                <img src={selectedMeal.image} alt="食事拡大" className="friend-meal-large-img" />
                {selectedMeal.note && (
                  <div className="friend-meal-note">💬 {selectedMeal.note}</div>
                )}
                {selectedMeal.tags && selectedMeal.tags.length > 0 && (
                  <div className="detail-tags" style={{ marginTop: "6px" }}>
                    {selectedMeal.tags.map((t) => (
                      <span key={t} className="detail-tag-badge">{t}</span>
                    ))}
                  </div>
                )}

                {/* Reaction Stamps */}
                <div className="reaction-stamps-wrap">
                  <div className="reaction-label">リアクションスタンプ（タップして送信）:</div>
                  <div className="reaction-buttons">
                    <button
                      onClick={(e) => triggerReactionWithBurst(e, "baenai", "🏆")}
                      className="btn-stamp"
                      title="映えなさ満点"
                    >
                      🏆 映えなさ満点
                    </button>
                    <button
                      onClick={(e) => triggerReactionWithBurst(e, "praise", "🍳")}
                      className="btn-stamp"
                      title="えらい"
                    >
                      🍳 えらい
                    </button>
                    <button
                      onClick={(e) => triggerReactionWithBurst(e, "grass", "🌿")}
                      className="btn-stamp"
                      title="草"
                    >
                      🌿 草
                    </button>
                    <button
                      onClick={(e) => triggerReactionWithBurst(e, "tasty", "🤤")}
                      className="btn-stamp"
                      title="うまそう"
                    >
                      🤤 うまそう
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedMeal && "skipped" in selectedMeal && selectedMeal.skipped ? (
              <div className="friend-meal-empty-text">
                この食事は「スキップ（食べなかった）」と記録されています。
              </div>
            ) : (
              <div className="friend-meal-empty-text">
                まだ記録されていません（未記録）
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} className="btn-cancel" style={{ marginTop: "16px" }}>
          閉じる
        </button>
      </div>
    </div>
  );
}

