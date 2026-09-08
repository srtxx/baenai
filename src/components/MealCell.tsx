import React from "react";
import { Icon } from "./icons/Icons";
import { photoUrl } from "../utils/helpers";
import { Meal } from "../types";

interface MealCellProps {
  meal: Meal;
  isToday: boolean;
  isCurrentSlot?: boolean;
  isFuture?: boolean;
  isJustSaved?: boolean;
  onClick: () => void;
}

const MealCell = React.memo(function MealCell({
  meal,
  isToday,
  isCurrentSlot,
  isFuture,
  isJustSaved,
  onClick,
}: MealCellProps): React.JSX.Element {
  if (!meal) {
    return (
      <div
        onClick={onClick}
        className={`meal-cell meal-cell-empty ${isToday ? "today" : ""} ${isCurrentSlot ? "current-slot" : ""} ${isFuture ? "is-future" : ""}`}
        title={isFuture ? "これからの食事（タップして予定または先取り記録）" : "食事を記録"}
      >
        <span className="plus-icon"><Icon.Plus /></span>
        {isCurrentSlot && (
          <span className="now-badge">
            <span className="now-dot" />いま
          </span>
        )}
      </div>
    );
  }

  if ("skipped" in meal && meal.skipped) {
    return (
      <div
        onClick={onClick}
        className={`meal-cell meal-cell-rested ${isJustSaved ? "meal-cell-just-saved" : ""}`}
        title="休食（体を休める）"
      >
        <span className="rested-mark">—</span>
        <span className="rested-label">休食</span>
      </div>
    );
  }

  const noteText = "note" in meal && meal.note ? meal.note : "";
  const firstTag = "tags" in meal && meal.tags && meal.tags.length > 0 ? meal.tags[0] : "";
  const displayLabel = noteText || (firstTag ? `#${firstTag}` : "");

  // SVGアイコンまたはスタイル記録の場合
  const iconKey = ("iconKey" in meal && meal.iconKey) || ("style" in meal && meal.style);
  if (iconKey && !("image" in meal && meal.image)) {
    const renderCellIcon = () => {
      switch (iconKey) {
        case "pan":
        case "cook":
          return <Icon.Pan size={20} />;
        case "store":
          return <Icon.Store size={20} />;
        case "utensils":
        case "out":
          return <Icon.Utensils size={20} />;
        case "coffee":
        case "cafe":
          return <Icon.Coffee size={20} />;
        case "takeout":
          return <Icon.Takeout size={20} />;
        default:
          return <Icon.Utensils size={20} />;
      }
    };

    return (
      <div
        onClick={onClick}
        className={`meal-cell meal-cell-emoji ${displayLabel ? "has-text" : ""} ${isJustSaved ? "meal-cell-just-saved" : ""}`}
        title={noteText || displayLabel || "食事の記録"}
      >
        <span className="cell-style-icon-wrap">{renderCellIcon()}</span>
        {displayLabel && (
          <span className="cell-inline-text">{displayLabel}</span>
        )}
      </div>
    );
  }

  // 過去データのクイック絵文字がある場合の互換性フォールバック
  if ("quickEmoji" in meal && meal.quickEmoji && !("image" in meal && meal.image)) {
    return (
      <div
        onClick={onClick}
        className={`meal-cell meal-cell-emoji ${displayLabel ? "has-text" : ""} ${isJustSaved ? "meal-cell-just-saved" : ""}`}
        title={noteText || meal.quickEmoji}
      >
        <span className="cell-emoji-char">{meal.quickEmoji}</span>
        {displayLabel && (
          <span className="cell-inline-text">{displayLabel}</span>
        )}
      </div>
    );
  }

  let imgSrc = "";
  if ("image" in meal && meal.image) {
    imgSrc = meal.image;
  } else if ("seed" in meal && meal.seed) {
    imgSrc = photoUrl(meal.seed, 120, 90);
  }

  return (
    <div
      onClick={onClick}
      className={`meal-cell meal-cell-filled ${isJustSaved ? "meal-cell-just-saved" : ""}`}
      title={noteText || "食事の写真"}
    >
      {imgSrc ? (
        <div className="meal-cell-photo-wrap">
          <img
            src={imgSrc}
            alt="食事の写真"
            className="meal-cell-image"
            loading="lazy"
          />
          {displayLabel && (
            <div className="cell-photo-overlay-label">
              <span>{displayLabel}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="meal-cell-emoji has-text">
          <span className="cell-style-icon-wrap"><Icon.Utensils size={20} /></span>
          {displayLabel && <span className="cell-inline-text">{displayLabel}</span>}
        </div>
      )}
    </div>
  );
});

export default MealCell;

