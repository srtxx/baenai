import { useState, useEffect, useCallback } from "react";
import { Friend, Encouragement, Reaction, EncourageType, ReactionType } from "../types";
import {
  getSavedFriends,
  saveFriends,
  getSavedEncouragements,
  saveEncouragement,
  getSavedReactions,
  saveReaction,
  generateFriendCode
} from "../lib/socialStorage";
import { useProfile } from "./useProfile";
import { ENCOURAGE_MESSAGES } from "../constants";

export function useSocial() {
  const { profile, updateProfile } = useProfile();
  const [friends, setFriends] = useState<Friend[]>(() => getSavedFriends());
  const [encouragements, setEncouragements] = useState<Encouragement[]>(() => getSavedEncouragements());
  const [reactions, setReactions] = useState<Reaction[]>(() => getSavedReactions());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.friendCode) {
      const code = generateFriendCode();
      updateProfile({ friendCode: code });
    }
  }, [profile.friendCode, updateProfile]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // ともだちにやさしいことばを送る
  const sendEncouragement = useCallback((friendId: string, encourageType: EncourageType) => {
    const targetFriend = friends.find(f => f.id === friendId);
    if (!targetFriend) return;

    const typeMap: Record<EncourageType, { emoji: string; label: string }> = {
      otsukare: { emoji: "🍵", label: "おつかれさま" },
      erai: { emoji: "👏", label: "えらい" },
      yuruku: { emoji: "🌿", label: "ゆるくいこう" },
      saikou: { emoji: "✨", label: "今日も最高" },
      ganbarou: { emoji: "🤝", label: "一緒にがんばろ" },
      onaka: { emoji: "🍙", label: "おなかすいた" },
    };

    const msgData = typeMap[encourageType] || { emoji: "🍵", label: "おつかれさま" };
    const message = `${msgData.emoji} ${msgData.label}`;

    const newEncouragement: Encouragement = {
      id: "enc_" + Date.now(),
      senderId: profile.id || "me",
      senderName: profile.name,
      senderAvatar: profile.avatar,
      receiverId: friendId,
      encourageType,
      message,
      createdAt: new Date().toISOString()
    };

    saveEncouragement(newEncouragement);
    setEncouragements(prev => [newEncouragement, ...prev]);

    showToast(`${targetFriend.name} に「${message}」を送りました 🌱`);
  }, [friends, profile.id, profile.name, profile.avatar, showToast]);

  // フレンドコードでともだち追加
  const addFriendByCode = useCallback((code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: "コードを入力してください" };
    }

    if (cleanCode === profile.friendCode) {
      return { success: false, message: "自分のコードは追加できません" };
    }

    const exists = friends.some(f => f.friendCode === cleanCode);
    if (exists) {
      return { success: false, message: "すでにともだちです" };
    }

    const newFriend: Friend = {
      id: "friend_" + Date.now(),
      name: `新しいともだち`,
      handle: `@user_${cleanCode.replace("RN-", "").toLowerCase()}`,
      friendCode: cleanCode,
      todayStatus: {
        breakfast: "logged",
        lunch: "unlogged",
        dinner: "unlogged"
      },
      meals: Array(7).fill(null).map(() => [null, null, null]),
      lastActiveAt: "たった今"
    };

    const nextFriends = [newFriend, ...friends];
    setFriends(nextFriends);
    saveFriends(nextFriends);
    showToast(`${newFriend.name} を追加しました 🌱`);

    return { success: true, message: "ともだちを追加しました" };
  }, [friends, profile.friendCode, showToast]);

  // 食事へのリアクションスタンプ送信
  const addReaction = useCallback((mealSlotKey: string, reactionType: ReactionType) => {
    const newReaction: Reaction = {
      id: "reaction_" + Date.now(),
      mealSlotKey,
      userId: profile.id || "me",
      userName: profile.name,
      reactionType,
      createdAt: new Date().toISOString()
    };

    saveReaction(newReaction);
    setReactions(prev => [...prev, newReaction]);

    const stampName = reactionType === "otsukare" ? "おつかれさま 🍵" : reactionType === "erai" ? "えらい 👏" : reactionType === "yuruku" ? "ゆるくいこう 🌿" : "おいしそう 🤤";
    showToast(`「${stampName}」を送りました`);
  }, [profile.id, profile.name, showToast]);

  return {
    friends,
    encouragements,
    reactions,
    myFriendCode: profile.friendCode || "RN-0000",
    toastMessage,
    sendEncouragement,
    addFriendByCode,
    addReaction
  };
}
