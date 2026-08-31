import React, { useState } from "react";

interface AddFriendModalProps {
  myFriendCode: string;
  onClose: () => void;
  onAddFriend: (code: string) => { success: boolean; message: string };
}

export default function AddFriendModal({
  myFriendCode,
  onClose,
  onAddFriend
}: AddFriendModalProps): React.JSX.Element {
  const [inputCode, setInputCode] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(myFriendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = onAddFriend(inputCode);
    if (res.success) {
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-friend-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">ともだちを追加</h2>
            <p className="modal-subtitle">同じ時間を生きる人と、ゆるくつながる 🌱</p>
          </div>
          <button onClick={onClose} className="modal-close-icon-btn" aria-label="閉じる">
            ✕
          </button>
        </div>

        {/* My Friend Code Box */}
        <div className="friend-code-card">
          <div className="friend-code-label">あなたのフレンドコード</div>
          <div className="friend-code-display-row">
            <span className="friend-code-text">{myFriendCode}</span>
            <button
              type="button"
              onClick={handleCopy}
              className={`btn-copy-code ${copied ? "copied" : ""}`}
            >
              {copied ? "✨ コピー完了！" : "📋 コードをコピー"}
            </button>
          </div>
          <p className="friend-code-desc">
            このコードを共有して、ともだちと静かにつながりましょう。
          </p>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleSubmit} className="add-friend-form">
          <label className="modal-input-label">ともだちのコードを入力</label>
          <div className="add-friend-input-row">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="例: RN-8821"
              className="modal-text-input"
              maxLength={10}
            />
            <button type="submit" className="btn-modal-primary btn-add-friend-submit">
              追加する
            </button>
          </div>
          {error && <div className="modal-error-text">{error}</div>}
        </form>
      </div>
    </div>
  );
}
