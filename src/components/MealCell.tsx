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
        className={`meal-cell-empty ${isToday ? "today" : ""} ${isCurrentSlot ? "current-slot" : ""} ${isFuture ? "is-future" : ""}`}
        title={isFuture ? "これからの食事（タップして予定または先取り記録）" : "食事を記録"}
      >
        <span className="plus-icon"><Icon.Plus /></span>
        {isCurrentSlot && <span className="now-badge">いま</span>}
      </div>
    );
  }

  if ("skipped" in meal && meal.skipped) {
    return (
      <div
        onClick={onClick}
        className={`meal-cell-rested ${isJustSaved ? "meal-cell-just-saved" : ""}`}
        title="おやすみ"
      >
        <span className="rested-mark">—</span>
      </div>
    );
  }

  // クイック絵文字記録の場合
  if ("quickEmoji" in meal && meal.quickEmoji && !("image" in meal && meal.image)) {
    const hasMeta = ("note" in meal && !!meal.note) || ("tags" in meal && !!meal.tags && meal.tags.length > 0);
    return (
      <div
        onClick={onClick}
        className={`meal-cell-emoji ${isJustSaved ? "meal-cell-just-saved" : ""}`}
      >
        <span className="cell-emoji-char">{meal.quickEmoji}</span>
        {hasMeta && <div className="cell-indicator-dot" />}
      </div>
    );
  }

  let imgSrc = "";
  if ("image" in meal && meal.image) {
    imgSrc = meal.image;
  } else if ("seed" in meal && meal.seed) {
    imgSrc = photoUrl(meal.seed, 120, 90);
  }

  const hasMeta = ("note" in meal && !!meal.note) || ("tags" in meal && !!meal.tags && meal.tags.length > 0);

  return (
    <div
      onClick={onClick}
      className={`meal-cell-filled ${isJustSaved ? "meal-cell-just-saved" : ""}`}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="食事の写真"
          className="meal-cell-image"
        />
      ) : (
        <span className="cell-emoji-char">🍚</span>
      )}
      {hasMeta && <div className="cell-indicator-dot" />}
    </div>
  );
});

export default MealCell;
