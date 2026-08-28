import React from "react";

export default function StatusBar(): React.JSX.Element {
  return (
    <div className="status-bar">
      <span className="status-time">9:41</span>
      <div className="status-notch" />
      <div className="status-icons">
        <svg width="15" height="10" viewBox="0 0 17 11" fill="none">
          <rect x="0.5" y="0.5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1" />
          <rect x="2" y="2" width="10" height="6" rx="1.2" fill="currentColor" />
          <path d="M15 3.5V7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
