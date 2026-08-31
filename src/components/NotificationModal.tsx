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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">届いたことば</div>
        <div className="modal-subtitle">ともだちからのやさしいやりとり</div>

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
                        </div>
                        <div className="notif-body">
                          「{enc.message}」
                        </div>
                        <div className="notif-time">{new Date(enc.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onQuickRecord();
                      }}
                      className="btn-notif-action"
                    >
                      mogする
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
                          <span className="notif-sender">{r.userName}</span> があなたのmogに
                        </div>
                        <div className="notif-body">
                          「{stampLabel}」とリアクションしました
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={onClose} className="btn-cancel" style={{ marginTop: "16px" }}>
          閉じる
        </button>
      </div>
    </div>
  );
}
