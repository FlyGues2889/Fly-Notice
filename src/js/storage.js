import { STORAGE_KEYS } from "./constants.js";

/**
 * 保存通知数组到本地存储
 * @param {Array} notifications - 通知数组
 */
export const saveNotificationsToLocalStorage = (notifications) => {
  localStorage.setItem(
    STORAGE_KEYS.NOTIFICATIONS,
    JSON.stringify(notifications),
  );
};

/**
 * 从本地存储加载通知数组
 * @returns {Array} 通知数组
 */
export const loadNotificationsFromLocalStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("加载通知失败", e);
      return [];
    }
  }
  return [];
};

/**
 * 保存通用设置项
 * @param {string} key - 存储键名
 * @param {string|number} value - 存储值
 */
export const saveSettings = (key, value) => {
  localStorage.setItem(key, value);
};

/**
 * 加载通用设置项
 * @param {string} key - 存储键名
 * @param {*} defaultValue - 默认值（如果键不存在）
 * @returns {string|null} 存储值或默认值
 */
export const loadSettings = (key, defaultValue = null) => {
  return localStorage.getItem(key) || defaultValue;
};