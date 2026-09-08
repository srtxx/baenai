import React, { useState, useRef } from "react";
import { useMeals } from "./hooks/useMeals";
import { useAchievements } from "./hooks/useAchievements";
import { useProfile } from "./hooks/useProfile";
import { useCustomTags } from "./hooks/useCustomTags";
import { DAYS } from "./constants";
import "./App.css";
import { Icon } from "./components/icons/Icons";
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
import { compressImage } from "./utils/imageCompressor";
import { DayIndex, MealIndex, MealSlot, ModalState, Meal } from "./types";

const QUICK_TOAST_TAGS = ["自炊", "外食", "コンビニ", "テイクアウト", "カフェ"] as const;

interface ToastState {
  id: number;
  message: string;
  slot?: MealSlot;
  showQuickTags?: boolean;
}

export default function App(): React.JSX.Element {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMondayOfCurrentWeek());
  const weekKey = getWeekKey(currentWeekStart);

  const { profile, updateProfile } = useProfile();
  const { meals, isLoading, saveMeal, deleteMeal, resetAllData, stats } = useMeals(weekKey);
  const { customTags, addCustomTag, removeCustomTag } = useCustomTags();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', profile.themePreference || 'ecru');
  }, [profile.themePreference]);

  const {
    achievements,
    recordShareGenerated
  } = useAchievements(meals);

  const [activeModal, setActiveModal] = useState<ModalState>(null);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>({ di: 0, mi: 0 });
  const [justSavedSlot, setJustSavedSlot] = useState<MealSlot | null>(null);
  const [detailInitialEditing, setDetailInitialEditing] = useState<boolean>(false);

  const directCameraInputRef = useRef<HTMLInputElement>(null);

  // 今週・過去・未来判定
  const todayMonday = getMondayOfCurrentWeek();
  const isCurrentWeek = currentWeekStart.getTime() === todayMonday.getTime();
  const isFutureWeek = currentWeekStart.getTime() > todayMonday.getTime();
  const isPastWeek = currentWeekStart.getTime() < todayMonday.getTime();

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

  // 週末判定（金曜夕方〜日曜、または過去週閲覧時）
  const isWeekendOrPast = React.useMemo(() => {
    if (isPastWeek) return true;
    if (isCurrentWeek) {
      const now = new Date();
      const day = now.getDay(); // 0: Sun, 5: Fri, 6: Sat
      const hours = now.getHours();
      return day === 0 || day === 6 || (day === 5 && hours >= 17);
    }
    return false;
  }, [isPastWeek, isCurrentWeek]);

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

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = React.useCallback(
    (
      message: string,
      slot?: MealSlot,
      showQuickTags = false,
      duration = 2800
    ) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      const id = Date.now();
      setToast({ id, message, slot, showQuickTags });
      toastTimeoutRef.current = setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, duration);
    },
    []
  );

  // カメラボタン押下時：モーダルを介さずダイレクトにカメラ/画像選択を起動
  const handleCameraClick = () => {
    directCameraInputRef.current?.click();
  };

  // ダイレクト撮影/画像選択時のハンドラ：圧縮後に即座に現在スロットへ保存
  const handleDirectPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    try {
      const compressed = await compressImage(file, 720, 720, 0.75);
      handleSaveMeal(di, mi, { image: compressed });
    } catch (err) {
      console.error("ダイレクト画像保存エラー:", err);
      showToast("写真の読み込みに失敗しました");
    } finally {
      e.target.value = "";
    }
  };

  const handleSaveMeal = (di: DayIndex, mi: MealIndex, mealData: Meal, isEdit = false) => {
    saveMeal(di, mi, mealData);
    setJustSavedSlot({ di, mi });
    setTimeout(() => {
      setJustSavedSlot((prev) => (prev?.di === di && prev?.mi === mi ? null : prev));
    }, 850);

    if (isEdit) {
      showToast("記録を更新しました", { di, mi }, false, 2800);
    } else if (mealData && "skipped" in mealData && mealData.skipped) {
      showToast("休食を記録しました", undefined, false, 2800);
    } else if (mealData && "image" in mealData && mealData.image) {
      showToast("写真を保存しました", { di, mi }, true, 5000);
    } else if (mealData) {
      showToast("記録を保存しました", { di, mi }, true, 4500);
    }
  };

  // トースト内でのクイックタグ付けトグル
  const handleToggleToastTag = (tag: string) => {
    if (!toast?.slot) return;
    const { di, mi } = toast.slot;
    const currentMeal = meals[di]?.[mi];
    if (!currentMeal || ("skipped" in currentMeal && currentMeal.skipped)) return;

    const currentTags = ("tags" in currentMeal && currentMeal.tags) ? currentMeal.tags : [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    const updatedMeal: Meal = {
      image: "image" in currentMeal ? currentMeal.image : undefined,
      style: "style" in currentMeal ? currentMeal.style : undefined,
      iconKey: "iconKey" in currentMeal ? currentMeal.iconKey : undefined,
      quickEmoji: "quickEmoji" in currentMeal ? currentMeal.quickEmoji : undefined,
      note: "note" in currentMeal ? currentMeal.note : undefined,
      tags: newTags.length > 0 ? newTags : undefined,
    };

    saveMeal(di, mi, updatedMeal);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    const message = newTags.includes(tag)
      ? `タグ「#${tag}」を追加しました`
      : `タグ「#${tag}」を解除しました`;

    setToast({
      ...toast,
      message,
      showQuickTags: true,
    });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // トースト内の「メモを追加」から直接詳細モーダルを編集モードで開く
  const handleOpenToastDetail = () => {
    if (!toast?.slot) return;
    setSelectedSlot(toast.slot);
    setDetailInitialEditing(true);
    setActiveModal("detail");
    setToast(null);
  };

  const handleDeleteMeal = (di: DayIndex, mi: MealIndex) => {
    deleteMeal(di, mi);
    showToast("記録を削除しました");
  };

  const handleResetAll = async () => {
    await resetAllData();
    showToast("すべての記録を初期化しました");
  };

  const handleCellClick = (di: DayIndex, mi: MealIndex, meal: unknown) => {
    setSelectedSlot({ di, mi });
    setDetailInitialEditing(false);
    if (meal) {
      setActiveModal("detail");
    } else {
      setActiveModal("add");
    }
  };

  const selectedMeal = meals[selectedSlot.di][selectedSlot.mi];

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
          stats={stats}
        />

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

        {/* Weekend Survival Report Prompt Card */}
        {isWeekendOrPast && (
          <div
            className="weekend-survival-card"
            onClick={() => {
              setActiveModal("share");
              recordShareGenerated();
            }}
          >
            <div className="weekend-survival-inner">
              <div className="weekend-survival-icon-wrap">
                <Icon.Share size={18} />
              </div>
              <div className="weekend-survival-texts">
                <span className="weekend-survival-tag">週末の生存報告</span>
                <span className="weekend-survival-title">今週もなんとか生き抜いた記録を画像に残す</span>
              </div>
              <div className="weekend-survival-arrow">
                <Icon.ChevronRight size={16} />
              </div>
            </div>
          </div>
        )}

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

      {/* Hidden File Input for Direct Camera Shooting */}
      <input
        type="file"
        ref={directCameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleDirectPhotoChange}
        style={{ display: "none" }}
      />

      {/* Global Gentle Interactive Toast */}
      {toast && (
        <div
          key={toast.id}
          className={`social-toast ${toast.showQuickTags ? "has-actions" : ""}`}
        >
          <div className="toast-header-line">
            <div className="toast-message-wrap">
              <Icon.Check size={14} className="social-toast-icon" />
              <span className="toast-text">{toast.message}</span>
            </div>
            {toast.slot && toast.showQuickTags && (
              <button
                type="button"
                className="toast-action-btn"
                onClick={handleOpenToastDetail}
                title="ひとことメモを追加・編集"
              >
                <Icon.Edit size={12} />
                <span>
                  {meals[toast.slot.di]?.[toast.slot.mi] &&
                  "note" in meals[toast.slot.di][toast.slot.mi]! &&
                  meals[toast.slot.di][toast.slot.mi]!.note
                    ? "メモを編集"
                    : "メモを追加"}
                </span>
              </button>
            )}
          </div>

          {toast.slot && toast.showQuickTags && (
            <div className="toast-quick-tags-row">
              {Array.from(new Set([...QUICK_TOAST_TAGS, ...customTags.slice(-4).reverse()])).map((tag) => {
                const targetMeal = meals[toast.slot!.di]?.[toast.slot!.mi];
                const isSelected = !!(
                  targetMeal &&
                  "tags" in targetMeal &&
                  targetMeal.tags?.includes(tag)
                );
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`toast-tag-chip ${isSelected ? "active" : ""}`}
                    onClick={() => handleToggleToastTag(tag)}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {activeModal === "add" && (
        <AddMealModal
          di={selectedSlot.di}
          mi={selectedSlot.mi}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveMeal}
          customTags={customTags}
          onAddCustomTag={addCustomTag}
          onRemoveCustomTag={removeCustomTag}
        />
      )}

      {activeModal === "detail" && selectedMeal && (
        <MealDetailModal
          di={selectedSlot.di}
          mi={selectedSlot.mi}
          meal={selectedMeal}
          initialEditing={detailInitialEditing}
          onClose={() => {
            setActiveModal(null);
            setDetailInitialEditing(false);
          }}
          onDelete={handleDeleteMeal}
          onSave={(di, mi, data) => handleSaveMeal(di, mi, data, true)}
          customTags={customTags}
          onAddCustomTag={addCustomTag}
          onRemoveCustomTag={removeCustomTag}
        />
      )}

      {activeModal === "settings" && (
        <SettingsModal
          profile={profile}
          onUpdateProfile={updateProfile}
          onClose={() => setActiveModal(null)}
          onResetAll={handleResetAll}
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





