import React, { useState } from "react";
import { useMeals } from "./hooks/useMeals";
import { DAYS } from "./constants";
import "./App.css";
import StatusBar from "./components/StatusBar";
import Header from "./components/Header";
import MealCell from "./components/MealCell";
import BottomNav from "./components/BottomNav";
import AddMealModal from "./components/AddMealModal";
import MealDetailModal from "./components/MealDetailModal";
import { getMondayOfCurrentWeek, getWeekKey } from "./utils/helpers";
import { DayIndex, MealIndex, MealSlot, ModalState } from "./types";

export default function App(): React.JSX.Element {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMondayOfCurrentWeek());
  const weekKey = getWeekKey(currentWeekStart);

  const { meals, isLoading, saveMeal, deleteMeal } = useMeals(weekKey);

  const [activeModal, setActiveModal] = useState<ModalState>(null);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>({ di: 0, mi: 0 });

  // currentWeekStart から週の日付配列を動的生成
  const datesList = (() => {
    const list: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      list.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }
    return list;
  })();

  const weekRangeLabel = (() => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(start.getDate() + 6);
    const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
    const endStr = `${end.getMonth() + 1}/${end.getDate()}`;
    return `${start.getFullYear()}/${startStr} (Mon) — ${endStr} (Sun)`;
  })();

  const currentDayIndex = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonday = getMondayOfCurrentWeek(today);
    if (currentWeekStart.getTime() === currentMonday.getTime()) {
      return ((today.getDay() + 6) % 7) as DayIndex; // 月:0〜日:6
    }
    return -1;
  })();

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleCameraClick = () => {
    const now = new Date();
    const hours = now.getHours();

    let mi: MealIndex = 1; // 昼食
    if (hours >= 4 && hours < 11) {
      mi = 0; // 朝食
    } else if (hours >= 11 && hours < 17) {
      mi = 1; // 昼食
    } else {
      mi = 2; // 夕食
    }

    const todayMonday = getMondayOfCurrentWeek(now);
    setCurrentWeekStart(todayMonday);
    const di = ((now.getDay() + 6) % 7) as DayIndex; // 月:0〜日:6

    setSelectedSlot({ di, mi });
    setActiveModal("add");
  };

  const handleCellClick = (di: DayIndex, mi: MealIndex, meal: unknown) => {
    setSelectedSlot({ di, mi });
    if (meal) {
      setActiveModal("detail");
    } else {
      setActiveModal("add");
    }
  };

  const selectedMeal = meals[selectedSlot.di][selectedSlot.mi];

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span className="loading-text">RATION</span>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="app-container">

        <StatusBar />

        <Header
          weekLabel={weekRangeLabel}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
        />

        <div className="divider" />

        {/* Column labels */}
        <div className="column-labels">
          <div className="column-label-spacer" />
          {["朝", "昼", "夜"].map(m => (
            <div key={m} className="column-label">{m}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="meal-grid">
          {meals.map((dayMeals, di) => {
            const dayIndex = di as DayIndex;
            const isToday = dayIndex === currentDayIndex;
            return (
              <div
                key={di}
                className={`day-row ${isToday ? "today" : ""}`}
              >
                {/* Day info column */}
                <div className="day-info">
                  <div className={`day-name ${isToday ? "today" : di === 5 ? "saturday" : ""}`}>
                    {DAYS[dayIndex]}
                  </div>
                  <div className={`day-date ${isToday ? "today" : ""}`}>
                    {datesList[di]}
                  </div>
                  {isToday && (
                    <div className="today-dot" />
                  )}
                </div>
                {/* Meal Cells */}
                {dayMeals.map((meal, mi) => {
                  const mealIndex = mi as MealIndex;
                  return (
                    <MealCell
                      key={mi}
                      meal={meal}
                      isToday={isToday}
                      onClick={() => handleCellClick(dayIndex, mealIndex, meal)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        <BottomNav onCameraClick={handleCameraClick} />
      </div>

      {/* Modals */}
      {activeModal === "add" && (
        <AddMealModal
          di={selectedSlot.di}
          mi={selectedSlot.mi}
          onClose={() => setActiveModal(null)}
          onSave={saveMeal}
        />
      )}

      {activeModal === "detail" && selectedMeal && (
        <MealDetailModal
          di={selectedSlot.di}
          mi={selectedSlot.mi}
          meal={selectedMeal}
          onClose={() => setActiveModal(null)}
          onDelete={deleteMeal}
        />
      )}
    </div>
  );
}
