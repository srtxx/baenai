import React from "react";
import { Encouragement, Reaction } from "../types";

interface NotificationModalProps {
  encouragements: Encouragement[];
  reactions: Reaction[];
  onClose: () => void;
  onQuickRecord: () => void;
}

export default function NotificationModal({
  encouragements,
  reactions,
  onClose,
  onQuickRecord
}: NotificationModalProps): React.JSX.Element {
  const hasNotifications = encouragements.length > 0 || reactions.length > 0;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "今日";
    if (timeStr.includes("前") || timeStr.includes("今日") || timeStr.includes("昨日")) return timeStr;
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notification-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">届いたことば</h2>
            <p className="modal-subtitle">ともだちからのやさしいやりとり ✉️</p>
          </div>
          <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
            ✕
          </button>
        </div>

        <div className="notification-list-wrap">
          {!hasNotifications ? (
            <div className="notification-empty">
              <span className="empty-icon">✉️</span>
              <p>まだ新しいことばはありません。<br />ともだちから励ましやリアクションが届くとここに表示されます。</p>
            </div>
          ) : (
            <div className="notification-scroll-area">
              {encouragements.map((enc) => {
                return (
                  <div key={enc.id} className="notification-item nudge-item">
                    <div className="notif-left">
                      <div className="notif-avatar">
                        {enc.senderAvatar ? (
                          <img src={enc.senderAvatar} alt={enc.senderName} className="avatar-img" />
                        ) : (
                          <div className="avatar-placeholder">
                            {enc.senderName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="notif-info">
                        <div className="notif-title">
                          <span className="notif-sender">{enc.senderName}</span> から
                          <span className="notif-time">{formatTime(enc.createdAt)}</span>
                        </div>
                        <div className="notif-speech-bubble">
                          {enc.message}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onQuickRecord();
                      }}
                      className="btn-notif-action"
                      title="mogする"
                    >
                      mogする 📸
                    </button>
                  </div>
                );
              })}

              {reactions.map((r) => {
                const stampLabel =
                  r.reactionType === "otsukare"
                    ? "おつかれさま 🍵"
                    : r.reactionType === "erai"
                    ? "えらい 👏"
                    : r.reactionType === "yuruku"
                    ? "ゆるくいこう 🌿"
                    : "おいしそう 🤤";

                const stampEmoji =
                  r.reactionType === "otsukare" ? "🍵" : r.reactionType === "erai" ? "👏" : r.reactionType === "yuruku" ? "🌿" : "🤤";

                return (
                  <div key={r.id} className="notification-item reaction-item">
                    <div className="notif-left">
                      <span className="reaction-stamp-icon">{stampEmoji}</span>
                      <div className="notif-info">
                        <div className="notif-title">
                          <span className="notif-sender">{r.userName || "ともだち"}</span> がリアクション
                          <span className="notif-time">{formatTime(r.createdAt)}</span>
                        </div>
                        <div className="notif-reaction-text">
                          「{stampLabel}」を送りました
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
