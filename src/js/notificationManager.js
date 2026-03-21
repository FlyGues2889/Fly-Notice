import { generateUniqueId, snackbar } from "./utils.js";
import { saveNotificationsToLocalStorage } from "./storage.js";
import { renderNotifications } from "./uiManager.js";
import { updateScreensaverCount } from "./screenSaver.js";
import { UI_SELECTORS } from "./constants.js";

let notifications = [];
let currentIndex = 0;
let currentPlayingNotifyId = null;
let isDialogClosing = false;

export const getNotifications = () => [...notifications];
export const getCurrentIndex = () => currentIndex;
export const setCurrentIndex = (index) => { currentIndex = index; };
export const getCurrentPlayingNotifyId = () => currentPlayingNotifyId;
export const setCurrentPlayingNotifyId = (id) => { currentPlayingNotifyId = id; };
export const getIsDialogClosing = () => isDialogClosing;
export const setIsDialogClosing = (value) => { isDialogClosing = value; };

export const addNotification = (content) => {
  if (!content.trim()) return;

  const isImportant = document.getElementById(UI_SELECTORS.CHECK_IMPORTANT)?.checked || false;

  const newNotification = {
    id: generateUniqueId(),
    content: content,
    createTime: new Date().toISOString(),
    isImportant: isImportant,
  };

  notifications.push(newNotification);
  saveNotificationsToLocalStorage(notifications);
  renderNotifications();

  const screenSaver = document.getElementById(UI_SELECTORS.SCREEN_SAVER);
  if (screenSaver && screenSaver.style.display === "flex") {
    updateScreensaverCount();
  }

  snackbar("已添加新通知", 1000, "bottom-end");
  const textField = document.getElementById(UI_SELECTORS.TEXT_FIELD);
  if (textField) textField.value = "";
  const checkImportant = document.getElementById(UI_SELECTORS.CHECK_IMPORTANT);
  if (checkImportant) checkImportant.checked = false;
};

export const deleteNotification = (id) => {
  const deleteIndex = notifications.findIndex(
    (notification) => notification.id === id,
  );

  notifications = notifications.filter(
    (notification) => notification.id !== id,
  );

  saveNotificationsToLocalStorage(notifications);

  if (notifications.length > 0) {
    if (deleteIndex === currentIndex || currentIndex >= notifications.length) {
      currentIndex = Math.max(0, currentIndex - 1);
    }
  } else {
    currentIndex = 0;
  }

  renderNotifications();

  const screenSaver = document.getElementById(UI_SELECTORS.SCREEN_SAVER);
  if (screenSaver && screenSaver.style.display === "flex") {
    updateScreensaverCount();
  }

  snackbar("通知已删除", 1000, "bottom-end");
};

export const clearAllNotifications = () => {
  if (notifications.length === 0) {
    snackbar("队列中没有通知可以删除", 1500, "bottom-end");
    return;
  }
  
  mdui.dialog({
    description: "确定要删除通知列表内的所有通知吗？此操作无法撤销。",
    actions: [
      { text: "取消" },
      {
        text: "确定",
        onClick: () => {
          notifications = [];
          saveNotificationsToLocalStorage(notifications);
          renderNotifications();
          snackbar("通知队列已清空", 1500, "bottom-end");
        },
      }
    ]
  });
};

export const updateNotification = (id, newContent, newIsImportant) => {
  if (!newContent.trim()) return;

  const index = notifications.findIndex(
    (notification) => notification.id === id,
  );
  if (index !== -1) {
    notifications[index].content = newContent;
    notifications[index].createTime = new Date().toISOString();
    notifications[index].isImportant = newIsImportant;

    saveNotificationsToLocalStorage(notifications);
    renderNotifications();
    snackbar("通知已更新", 1000, "bottom-end");
  }
};

export const setNotifications = (data) => {
  notifications = data;
};