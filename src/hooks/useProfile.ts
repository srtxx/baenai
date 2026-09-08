import { useState, useEffect, useCallback } from "react";
import { UserProfile } from "../types";
import { getUserProfile, saveUserProfile } from "../db";

const PROFILE_CACHE_KEY = "mog_user_profile_cache";
const PROFILE_EVENT_NAME = "mog:profile-updated";

function getCachedProfile(): UserProfile {
  if (typeof window === "undefined") {
    return { name: "USER" };
  }
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          name: typeof parsed.name === "string" ? parsed.name : "USER",
          handle: parsed.handle || "",
          avatar: parsed.avatar,
          themePreference: parsed.themePreference || "ecru",
          supabaseUrl: parsed.supabaseUrl || "",
          supabaseKey: parsed.supabaseKey || "",
        };
      }
    }
  } catch {
    // fallback
  }
  return { name: "USER" };
}

function setCachedProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // quota exceeded or private mode
  }
}

export function useProfile() {
  // 初期レンダリング時からキャッシュを用いてチラつきを防止
  const [profile, setProfile] = useState<UserProfile>(() => getCachedProfile());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初回マウント時にIndexedDBから最新プロファイルを取得
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const p = await getUserProfile();
        if (isMounted && p) {
          setProfile(p);
          setCachedProfile(p);
        }
      } catch (e) {
        console.error("Failed to load profile from IndexedDB", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // 全画面・別コンポーネント間でのプロフィール変更同期イベント監視
  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      }
    };

    window.addEventListener(PROFILE_EVENT_NAME, handleProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_EVENT_NAME, handleProfileUpdated);
    };
  }, []);

  const updateProfile = useCallback(async (newProfile: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated: UserProfile = { ...prev, ...newProfile };

      // 1. 同期キャッシュを即座に更新
      setCachedProfile(updated);

      // 2. 他のすべてのコンポーネントへイベント通知
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent<UserProfile>(PROFILE_EVENT_NAME, { detail: updated })
        );
      }

      // 3. IndexedDBへの非同期永続化
      saveUserProfile(updated).catch((e) => {
        console.error("Failed to save profile to IndexedDB", e);
      });

      return updated;
    });
  }, []);

  return { profile, isLoading, updateProfile };
}
