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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">ともだちを追加</div>
        <div className="modal-subtitle">同じ時間を生きる人と、ゆるくつながる</div>

        {/* My Friend Code Box */}
        <div className="friend-code-card">
          <div className="friend-code-label">あなたのコード</div>
          <div className="friend-code-display-row">
            <span className="friend-code-text">{myFriendCode}</span>
            <button onClick={handleCopy} className="btn-copy-code">
              {copied ? "コピー完了！" : "コードをコピー"}
            </button>
          </div>
          <p className="friend-code-desc">
            このコードを共有して、ともだちと静かにつながりましょう。
          </p>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleSubmit} className="add-friend-form">
          <label className="share-input-label">ともだちのコードを入力</label>
          <div className="add-friend-input-row">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="例: RN-8821"
              className="share-name-input"
              maxLength={10}
            />
            <button type="submit" className="btn-add-friend-submit">
              追加
            </button>
          </div>
          {error && <div className="share-error" style={{ padding: "8px 0 0", textAlign: "left" }}>{error}</div>}
        </form>

        <button onClick={onClose} className="btn-cancel" style={{ marginTop: "20px" }}>
          閉じる
        </button>
      </div>
    </div>
  );
}
