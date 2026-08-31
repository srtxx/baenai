import { useState, useEffect, useCallback } from "react";
import { UserProfile } from "../types";
import { getUserProfile, saveUserProfile } from "../db";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>({ name: "USER" });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const p = await getUserProfile();
        if (isMounted) setProfile(p);
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = useCallback(async (newProfile: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated: UserProfile = { ...prev, ...newProfile };
      saveUserProfile(updated).catch((e) => console.error("Failed to save profile", e));
      return updated;
    });
  }, []);

  return { profile, isLoading, updateProfile };
}
