// 用户信息持久化 store
// localStorage 存储用户自愿提供的联系方式+称呼
// email 是历史记录的钥匙：有 email → 才存历史

import { create } from "zustand";

const STORAGE_KEY = "ai-assist-user-profile";

interface UserProfile {
  readonly email?: string;
  readonly name?: string;
  readonly phone?: string;
}

interface UserProfileStore extends UserProfile {
  readonly hasEmail: boolean;
  readonly hasName: boolean;
  setField: (field: "email" | "name" | "phone", value: string) => void;
}

const loadProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveProfile = (profile: UserProfile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* silent */
  }
};

const initialProfile = loadProfile();

export const useUserProfile = create<UserProfileStore>((set) => ({
  ...initialProfile,
  hasEmail: !!initialProfile.email,
  hasName: !!initialProfile.name,
  setField: (field, value) => {
    const current = loadProfile();
    const updated = { ...current, [field]: value };
    saveProfile(updated);
    set({ ...updated, hasEmail: !!updated.email, hasName: !!updated.name });
  },
}));

/** 只在同步场景（非 React 组件）中读取当前 profile */
export const getProfileSync = (): UserProfile => loadProfile();