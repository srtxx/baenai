import React, { useState } from "react";
import { useMeals } from "./hooks/useMeals";
import { useAchievements } from "./hooks/useAchievements";
import { useProfile } from "./hooks/useProfile";
import { DAYS } from "./constants";
import "./App.css";
import StatusBar from "./components/StatusBar";
import Header from "./components/Header";
import MealCell from "./components/MealCell";
import BottomNav from "./components/BottomNav";
import AddMealModal from "./components/AddMealModal";
import MealDetailModal from "./components/MealDetailModal";
import SettingsModal from "./components/SettingsModal";
import ShareModal from "./components/ShareModal";
import AchievementsModal from "./components/AchievementsModal";
import { getMondayOfCurrentWeek, getWeekKey } from "./utils/helpers";
import { DayIndex, MealIndex, MealSlot, ModalState, Meal } from "./types";

export default function App(): React.JSX.Element {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMondayOfCurrentWeek());
  const weekKey = getWeekKey(currentWeekStart);

  const { profile, updateProfile } = useProfile();
  const { meals, isLoading, saveMeal, deleteMeal, resetAllData, stats } = useMeals(weekKey);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', profile.themePreference || 'ecru');
  }, [profile.themePreference]);

  const {
    achievements,
    recentlyUnlocked,
    recordShareGenerated
  } = useAchievements(meals);

  const [activeModal, setActiveModal] = useState<ModalState>(null);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>({ di: 0, mi: 0 });
  const [justSavedSlot, setJustSavedSlot] = useState<MealSlot | null>(null);

  // 今週かどうか
  const todayMonday = getMondayOfCurrentWeek();
  const isCurrentWeek = currentWeekStart.getTime() === todayMonday.getTime();

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
    return `${start.getFullYear()}/${startStr} (月) — ${endStr} (日)`;
  })();

  const currentDayIndex: DayIndex | -1 = (() => {
    if (isCurrentWeek) {
      const today = new Date();
      return ((today.getDay() + 6) % 7) as DayIndex; // 月:0〜日:6
    }
    return -1;
  })();

  const currentMealIndex = (() => {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 11) return 0; // 朝食
    if (hours >= 11 && hours < 17) return 1; // 昼食
    return 2; // 夕食
  })();

  const todayRowRef = React.useRef<HTMLDivElement>(null);

  // 今週表示時、今日の行が見えるように自動スクロール
  React.useEffect(() => {
    if (isCurrentWeek && !isLoading && todayRowRef.current) {
      todayRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isCurrentWeek, isLoading]);

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

  const handleJumpToToday = () => {
    setCurrentWeekStart(getMondayOfCurrentWeek());
    if (todayRowRef.current) {
      todayRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

    const currentMon = getMondayOfCurrentWeek(now);
    setCurrentWeekStart(currentMon);
    const di = ((now.getDay() + 6) % 7) as DayIndex;

    setSelectedSlot({ di, mi });
    setActiveModal("add");
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  const handleSaveMeal = (di: DayIndex, mi: MealIndex, mealData: Meal) => {
    saveMeal(di, mi, mealData);
    setJustSavedSlot({ di, mi });
    setTimeout(() => {
      setJustSavedSlot((prev) => (prev?.di === di && prev?.mi === mi ? null : prev));
    }, 850);

    if (mealData && "skipped" in mealData && mealData.skipped) {
      showToast("休食を記録しました");
    } else if (mealData) {
      showToast("記録しました");
    }
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

  // 週全体の未来・過去判定
  const isFutureWeek = currentWeekStart.getTime() > todayMonday.getTime();
  const isPastWeek = currentWeekStart.getTime() < todayMonday.getTime();

  if (isLoading) {
    return (
      <div className="loading-screen" data-theme={profile.themePreference || "ecru"}>
        <div className="loading-spinner" />
        <span className="loading-text">mog</span>
      </div>
    );
  }

  return (
    <div className="app-wrapper" data-theme={profile.themePreference || "ecru"}>
      <div className="app-container">

        <StatusBar />

        {/* My Weekly Log Header */}
        <Header
          weekLabel={weekRangeLabel}
          isCurrentWeek={isCurrentWeek}
          currentDayIndex={currentDayIndex}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleJumpToToday}
          onShareClick={() => {
            setActiveModal("share");
            recordShareGenerated();
          }}
          onAchievementsClick={() => setActiveModal("achievements")}
          stats={stats}
        />

        <div className="divider" />

        {/* Column labels */}
        <div className="column-labels">
          <div className="column-label-spacer" />
          {["朝", "昼", "夜"].map(m => (
            <div key={m} className="column-label">{m}</div>
          ))}
        </div>

        {/* 7x3 Meal Grid */}
        <div className="meal-grid">
          {meals.map((dayMeals, di) => {
            const dayIndex = di as DayIndex;
            const isToday = dayIndex === currentDayIndex;
            return (
              <div
                key={di}
                ref={isToday ? todayRowRef : null}
                className={`day-row ${isToday ? "today" : ""}`}
              >
                {/* Day info column */}
                <div className={`day-info ${isToday ? "today" : ""}`}>
                  {isToday && <span className="today-badge">きょう</span>}
                  <div className={`day-name ${isToday ? "today" : di === 5 ? "saturday" : di === 6 ? "sunday" : ""}`}>
                    {DAYS[dayIndex]}
                  </div>
                  <div className={`day-date ${isToday ? "today" : ""}`}>
                    {datesList[di]}
                  </div>
                </div>
                {/* Meal Cells */}
                {dayMeals.map((meal, mi) => {
                  const mealIndex = mi as MealIndex;
                  const isCurrentSlot = isToday && mealIndex === currentMealIndex;
                  
                  // 未来マス判定
                  let isFuture = false;
                  if (isFutureWeek) {
                    isFuture = true;
                  } else if (isPastWeek) {
                    isFuture = false;
                  } else if (isCurrentWeek) {
                    if (dayIndex > currentDayIndex) {
                      isFuture = true;
                    } else if (dayIndex === currentDayIndex && mealIndex > currentMealIndex) {
                      isFuture = true;
                    }
                  }

                  const isJustSaved = justSavedSlot?.di === dayIndex && justSavedSlot?.mi === mealIndex;

                  return (
                    <MealCell
                      key={mi}
                      meal={meal}
                      isToday={isToday}
                      isCurrentSlot={isCurrentSlot}
                      isFuture={isFuture}
                      isJustSaved={isJustSaved}
                      onClick={() => handleCellClick(dayIndex, mealIndex, meal)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          onHomeClick={handleJumpToToday}
          onAchievementsClick={() => setActiveModal("achievements")}
          onCameraClick={handleCameraClick}
          onShareClick={() => {
            setActiveModal("share");
            recordShareGenerated();
          }}
          onSettingsClick={() => setActiveModal("settings")}
        />
      </div>

      {/* Achievement Unlocked Banner */}
      {recentlyUnlocked && (
        <div className="achievement-unlocked-banner" onClick={() => setActiveModal("achievements")}>
          <span className="unlocked-badge-icon">{recentlyUnlocked.icon}</span>
          <div>
            <div className="unlocked-badge-tag">新しいしるし 🌱</div>
            <div className="unlocked-badge-title">{recentlyUnlocked.title}</div>
          </div>
        </div>
      )}

      {/* Global Gentle Toast */}
      {toastMessage && (
        <div className="social-toast">
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      {activeModal === "add" && (
        <AddMealModal
          di={selectedSlot.di}
          mi={selectedSlot.mi}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveMeal}
        />
      )}

      {activeModal === "detail" && selectedMeal && (
        <MealDetailModal
          di={selectedSlot.di}
          mi={selectedSlot.mi}
          meal={selectedMeal}
          onClose={() => setActiveModal(null)}
          onDelete={deleteMeal}
          onSave={handleSaveMeal}
        />
      )}

      {activeModal === "settings" && (
        <SettingsModal
          profile={profile}
          onUpdateProfile={updateProfile}
          onClose={() => setActiveModal(null)}
          onResetAll={resetAllData}
        />
      )}

      {activeModal === "share" && (
        <ShareModal
          meals={meals}
          weekLabel={weekRangeLabel}
          stats={stats}
          datesList={datesList}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "achievements" && (
        <AchievementsModal
          achievements={achievements}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}




