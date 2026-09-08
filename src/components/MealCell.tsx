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
  const hasTag = Boolean(firstTag);
  const hasNote = Boolean(noteText);
  const hasBoth = hasTag && hasNote;
  const hasContent = hasTag || hasNote;

  const cellTitle = hasBoth
    ? `[#${firstTag}] ${noteText}`
    : noteText
    ? noteText
    : hasTag
    ? `#${firstTag}`
    : "食事の記録";

  // SVGアイコンまたはスタイル記録の場合
  const iconKey = ("iconKey" in meal && meal.iconKey) || ("style" in meal && meal.style);
  if (iconKey && !("image" in meal && meal.image)) {
    const iconSize = hasBoth ? 17 : 20;
    const renderCellIcon = () => {
      switch (iconKey) {
        case "pan":
        case "cook":
          return <Icon.Pan size={iconSize} />;
        case "store":
          return <Icon.Store size={iconSize} />;
        case "utensils":
        case "out":
          return <Icon.Utensils size={iconSize} />;
        case "coffee":
        case "cafe":
          return <Icon.Coffee size={iconSize} />;
        case "takeout":
          return <Icon.Takeout size={iconSize} />;
        default:
          return <Icon.Utensils size={iconSize} />;
      }
    };

    return (
      <div
        onClick={onClick}
        className={`meal-cell meal-cell-emoji ${hasContent ? "has-text" : ""} ${hasBoth ? "has-both" : ""} ${isJustSaved ? "meal-cell-just-saved" : ""}`}
        title={cellTitle}
      >
        <span className="cell-style-icon-wrap">{renderCellIcon()}</span>
        {hasContent && (
          <div className="cell-text-group">
            {hasTag && <span className="cell-inline-tag">#{firstTag}</span>}
            {hasNote && <span className="cell-inline-note">{noteText}</span>}
          </div>
        )}
      </div>
    );
  }

  // 過去データのクイック絵文字がある場合の互換性フォールバック
  if ("quickEmoji" in meal && meal.quickEmoji && !("image" in meal && meal.image)) {
    return (
      <div
        onClick={onClick}
        className={`meal-cell meal-cell-emoji ${hasContent ? "has-text" : ""} ${hasBoth ? "has-both" : ""} ${isJustSaved ? "meal-cell-just-saved" : ""}`}
        title={cellTitle}
      >
        <span className="cell-emoji-char">{meal.quickEmoji}</span>
        {hasContent && (
          <div className="cell-text-group">
            {hasTag && <span className="cell-inline-tag">#{firstTag}</span>}
            {hasNote && <span className="cell-inline-note">{noteText}</span>}
          </div>
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
      title={cellTitle}
    >
      {imgSrc ? (
        <div className="meal-cell-photo-wrap">
          <img
            src={imgSrc}
            alt="食事の写真"
            className="meal-cell-image"
            loading="lazy"
          />
          {hasContent && (
            <div className={`cell-photo-overlay-label ${hasBoth ? "has-both" : ""}`}>
              {hasTag && <span className="cell-photo-tag">#{firstTag}</span>}
              {hasNote && <span className="cell-photo-note">{noteText}</span>}
            </div>
          )}
        </div>
      ) : (
        <div className={`meal-cell-emoji has-text ${hasBoth ? "has-both" : ""}`}>
          <span className="cell-style-icon-wrap"><Icon.Utensils size={hasBoth ? 17 : 20} /></span>
          {hasContent && (
            <div className="cell-text-group">
              {hasTag && <span className="cell-inline-tag">#{firstTag}</span>}
              {hasNote && <span className="cell-inline-note">{noteText}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MealCell;

