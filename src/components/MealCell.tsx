import React from "react";
import { Icon } from "./icons/Icons";
import { photoUrl } from "../utils/helpers";
import { Meal } from "../types";

interface MealCellProps {
  meal: Meal;
  isToday: boolean;
  onClick: () => void;
}

const MealCell = React.memo(function MealCell({ meal, isToday, onClick }: MealCellProps): React.JSX.Element {
  if (!meal) {
    return (
      <div
        onClick={onClick}
        className={`meal-cell-empty ${isToday ? "today" : ""}`}
      >
        <span className="plus-icon"><Icon.Plus /></span>
      </div>
    );
  }

  if ("skipped" in meal && meal.skipped) {
    return (
      <div
        onClick={onClick}
        className="meal-cell-skipped"
      />
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
      className="meal-cell-filled"
    >
      {imgSrc && (
        <img
          src={imgSrc}
          alt="食事の写真"
          className="meal-cell-image"
        />
      )}
      {hasMeta && <div className="cell-indicator-dot" />}
    </div>
  );
});

export default MealCell;
