import React, { useState } from "react";
import { useMeals } from "./hooks/useMeals";
import { useSocial } from "./hooks/useSocial";
import { useAchievements } from "./hooks/useAchievements";
import { useProfile } from "./hooks/useProfile";
import { DAYS } from "./constants";
import "./App.css";
import StatusBar from "./components/StatusBar";
import Header from "./components/Header";
import MealCell from "./components/MealCell";
import BottomNav from "./components/BottomNav";
import FriendsView from "./components/FriendsView";
import AddMealModal from "./components/AddMealModal";
import MealDetailModal from "./components/MealDetailModal";
import SettingsModal from "./components/SettingsModal";
import ShareModal from "./components/ShareModal";
import AddFriendModal from "./components/AddFriendModal";
import NotificationModal from "./components/NotificationModal";
import AchievementsModal from "./components/AchievementsModal";
import { getMondayOfCurrentWeek, getWeekKey } from "./utils/helpers";
import { DayIndex, MealIndex, MealSlot, ModalState, ActiveTab, Meal } from "./types";

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMondayOfCurrentWeek());
  const weekKey = getWeekKey(currentWeekStart);

  const { profile } = useProfile();
  const { meals, isLoading, saveMeal, deleteMeal, resetAllData, stats } = useMeals(weekKey);
  const {
    friends,
    encouragements,
    reactions,
    myFriendCode,
    toastMessage,
    sendEncouragement,
    addFriendByCode,
    addReaction
  } = useSocial();

  const {
    achievements,
    recentlyUnlocked,
    recordEncourageSent,
    recordShareGenerated
  } = useAchievements(meals, friends.length);

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

  const currentDayIndex = (() => {
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
    if (activeTab === "home" && isCurrentWeek && !isLoading && todayRowRef.current) {
      todayRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeTab, isCurrentWeek, isLoading]);

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
    setActiveTab("home");
    setActiveModal("add");
  };

  const handleSaveMeal = (di: DayIndex, mi: MealIndex, mealData: Meal) => {
    saveMeal(di, mi, mealData);
    setJustSavedSlot({ di, mi });
    setTimeout(() => {
      setJustSavedSlot((prev) => (prev?.di === di && prev?.mi === mi ? null : prev));
    }, 850);
  };

  const handleCellClick = (di: DayIndex, mi: MealIndex, meal: unknown) => {
    setSelectedSlot({ di, mi });
    if (meal) {
      setActiveModal("detail");
    } else {
      setActiveModal("add");
    }
  };

  const handleSendEncouragementWrapped = (friendId: string, type: import("./types").EncourageType) => {
    sendEncouragement(friendId, type);
    recordEncourageSent();
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

        {/* Home Tab: My Weekly Log */}
        {activeTab === "home" ? (
          <>
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
              onNotificationsClick={() => setActiveModal("notifications")}
              hasUnreadNudges={encouragements.length > 0}
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

            {/* Grid */}
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
          </>
        ) : (
          /* Friends Tab: Gentle Companions */
          <FriendsView
            friends={friends}
            encouragements={encouragements}
            currentDayIndex={currentDayIndex}
            currentMealIndex={currentMealIndex}
            myFriendCode={myFriendCode}
            onOpenAddFriend={() => setActiveModal("add_friend")}
            onOpenNotifications={() => setActiveModal("notifications")}
            onSendEncouragement={handleSendEncouragementWrapped}
            onSendReaction={addReaction}
          />
        )}

        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCameraClick={handleCameraClick}
          onSettingsClick={() => setActiveModal("settings")}
        />
      </div>

      {/* Achievement Unlocked Popup */}
      {recentlyUnlocked && (
        <div className="achievement-unlocked-banner" onClick={() => setActiveModal("achievements")}>
          <span className="unlocked-badge-icon">{recentlyUnlocked.icon}</span>
          <div>
            <div className="unlocked-badge-tag">きろくが灯りました 🌱</div>
            <div className="unlocked-badge-title">{recentlyUnlocked.title}</div>
          </div>
        </div>
      )}

      {/* Global Toast Alert */}
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

      {activeModal === "add_friend" && (
        <AddFriendModal
          myFriendCode={myFriendCode}
          onClose={() => setActiveModal(null)}
          onAddFriend={addFriendByCode}
        />
      )}

      {activeModal === "notifications" && (
        <NotificationModal
          encouragements={encouragements}
          reactions={reactions}
          onClose={() => setActiveModal(null)}
          onQuickRecord={handleCameraClick}
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



