import { useState, useEffect, useCallback } from "react";
import { getCustomTags, saveCustomTags } from "../db";
import { PRESET_TAGS } from "../constants";

export function useCustomTags() {
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTags() {
      try {
        const saved = await getCustomTags();
        if (isMounted) {
          // PRESET_TAGS と重複しないものに正規化
          const filtered = saved.filter(
            (t) => !PRESET_TAGS.includes(t as typeof PRESET_TAGS[number])
          );
          setCustomTags(filtered);
        }
      } catch (err) {
        console.error("Failed to load custom tags from IndexedDB", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadTags();
    return () => {
      isMounted = false;
    };
  }, []);

  const addCustomTag = useCallback((rawTag: string): string | null => {
    const cleanTag = rawTag.trim().replace(/^#+/, "");
    if (!cleanTag) return null;

    // プリセットタグにすでに存在する場合はマスタへの新規追加は不要（タグ自体は使える）
    if (PRESET_TAGS.includes(cleanTag as typeof PRESET_TAGS[number])) {
      return cleanTag;
    }

    setCustomTags((prev) => {
      if (prev.includes(cleanTag)) {
        return prev;
      }
      const updated = [...prev, cleanTag];
      saveCustomTags(updated).catch((err) =>
        console.error("Failed to save custom tags", err)
      );
      return updated;
    });

    return cleanTag;
  }, []);

  const removeCustomTag = useCallback((tagToRemove: string) => {
    setCustomTags((prev) => {
      const updated = prev.filter((t) => t !== tagToRemove);
      saveCustomTags(updated).catch((err) =>
        console.error("Failed to remove custom tag", err)
      );
      return updated;
    });
  }, []);

  return {
    customTags,
    isLoading,
    addCustomTag,
    removeCustomTag,
  };
}
