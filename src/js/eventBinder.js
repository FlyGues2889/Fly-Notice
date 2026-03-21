import { 
  addNotification, 
  clearAllNotifications, 
  updateNotification,
  getCurrentPlayingNotifyId,
  getIsDialogClosing,
  setIsDialogClosing,
  getNotifications,
  setCurrentPlayingNotifyId,
  deleteNotification
} from "./notificationManager.js";
import { 
  navigate, 
  showListContainer, 
  openAddDialog, 
  openInfoDialog
} from "./uiManager.js";
import { 
  toggleCarousel, 
  displayMessages, 
  showPrevNotification, 
  showNextNotification,
  getIsCarouselRunning
} from "./carouselManager.js";
import { toggleScreenSaver } from "./screenSaver.js";
import { UI_SELECTORS } from "./constants.js";
import { snackbar } from "./utils.js";

/**
 * 安全绑定事件的工具函数：如果元素不存在，跳过绑定不报错
 * @param {string} id - 元素ID
 * @param {string} event - 事件类型（如 'click'）
 * @param {Function} handler - 事件处理函数
 */
const safeBindEvent = (id, event, handler) => {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener(event, handler);
  } else {
    console.warn(`[EventBinder] 未找到元素 ID: ${id}，跳过事件绑定`);
  }
};

// 统一绑定所有DOM事件
export const bindEvents = () => {
  // 侧边栏开关
  safeBindEvent(UI_SELECTORS.LIST_CONTAINER_SWITCH, "click", showListContainer);
  // 打开添加通知弹窗
  safeBindEvent(UI_SELECTORS.OPEN_ADD_DIALOG_BUTTON, "click", openAddDialog);
  // 页面导航
  safeBindEvent(UI_SELECTORS.TO_MAIN, "click", () => navigate("mainPage"));
  safeBindEvent(UI_SELECTORS.TO_LIST, "click", () => navigate("listPage"));
  safeBindEvent(UI_SELECTORS.TO_SETTINGS, "click", () => navigate("settingPage"));
  // 清空所有通知
  safeBindEvent(UI_SELECTORS.CLEAR_ALL_BTN, "click", clearAllNotifications);
  // 编辑当前通知
  safeBindEvent(UI_SELECTORS.EDIT_NOTIFICATION_BTN, "click", openEditDialog);
  // 删除当前通知
  safeBindEvent(UI_SELECTORS.DELETE_NOTIFICATION_BTN, "click", deleteCurrentNotification);
  // 轮播暂停/继续
  safeBindEvent(UI_SELECTORS.CAROUSEL_TOGGLE_BTN, "click", () => toggleCarousel("slient"));
  // 上一条/下一条通知
  safeBindEvent(UI_SELECTORS.PREV_BTN, "click", showPrevNotification);
  safeBindEvent(UI_SELECTORS.NEXT_BTN, "click", showNextNotification);
  // 息屏显示开关
  safeBindEvent(UI_SELECTORS.TOGGLE_BUTTON, "click", toggleScreenSaver);
  safeBindEvent(UI_SELECTORS.EXIT_BUTTON, "click", toggleScreenSaver);
  // 打开关于弹窗
  safeBindEvent(UI_SELECTORS.OPEN_INFO_DIALOG_BTN, "click", openInfoDialog);
  // 确认添加通知
  safeBindEvent(UI_SELECTORS.CONFIRM_ADD_BTN, "click", handleAddNotification);
  // 确认编辑通知
  safeBindEvent(UI_SELECTORS.CLOSE_EDIT_BTN, "click", handleEditNotification);

  // 主题切换（单独处理，因为是直接操作 className）
  const themeAuto = document.getElementById(UI_SELECTORS.THEME_AUTO);
  const themeLight = document.getElementById(UI_SELECTORS.THEME_LIGHT);
  const themeDark = document.getElementById(UI_SELECTORS.THEME_DARK);
  const body = document.getElementById(UI_SELECTORS.BODY);

  if (themeAuto && body) {
    themeAuto.addEventListener("click", () => {
      body.className = "mdui-theme-auto";
    });
  }
  if (themeLight && body) {
    themeLight.addEventListener("click", () => {
      body.className = "mdui-theme-light";
    });
  }
  if (themeDark && body) {
    themeDark.addEventListener("click", () => {
      body.className = "mdui-theme-dark";
    });
  }

  // 编辑弹窗关闭事件
  const editDialog = document.querySelector(".edit-dialog");
  if (editDialog) {
    editDialog.addEventListener("close", handleEditDialogClose);
  }

  // 添加弹窗关闭事件
  const addDialog = document.querySelector(".add-dialog");
  if (addDialog) {
    addDialog.addEventListener("close", () => {
      const textField = document.getElementById(UI_SELECTORS.TEXT_FIELD);
      const checkImportant = document.getElementById(UI_SELECTORS.CHECK_IMPORTANT);
      if (textField) textField.value = "";
      if (checkImportant) checkImportant.checked = false;
    });
  }
};

// 处理添加通知
const handleAddNotification = () => {
  const textField = document.getElementById(UI_SELECTORS.TEXT_FIELD);
  if (textField) {
    addNotification(textField.value);
  }
  const addDialog = document.querySelector(".add-dialog");
  if (addDialog) {
    addDialog.open = false;
  }
  displayMessages();
};

// 打开编辑当前通知弹窗
const openEditDialog = () => {
  const notifications = getNotifications();
  if (notifications.length === 0) {
    snackbar("暂无通知可修改", 1500, "bottom-end");
    return;
  }

  // 暂停轮播
  if (getIsCarouselRunning()) {
    toggleCarousel();
  }

  const editDialog = document.querySelector(".edit-dialog");
  const editTextField = document.getElementById("editMsgContent");
  const changeImportantCheck = document.getElementById(UI_SELECTORS.CHANGE_IMPORTANT_CHECK);
  const showListElements = document.querySelectorAll(UI_SELECTORS.SHOW_LIST_ELEMENTS);

  if (!editDialog || !editTextField || !changeImportantCheck) return;

  // 匹配当前显示的通知
  const currentContent = showListElements[0]?.textContent.trim();
  const currentNotify = notifications.find(
    (notify) => notify.content.trim() === currentContent,
  );

  if (currentNotify) {
    setCurrentPlayingNotifyId(currentNotify.id);
    editTextField.value = currentNotify.content;
    changeImportantCheck.checked = currentNotify.isImportant;
  } else {
    // 兜底：取第一条通知
    setCurrentPlayingNotifyId(notifications[0].id);
    editTextField.value = notifications[0].content;
    changeImportantCheck.checked = notifications[0].isImportant;
  }

  setIsDialogClosing(false);
  editDialog.open = true;
};

// 处理编辑通知确认
const handleEditNotification = () => {
  const editTextField = document.getElementById("editMsgContent");
  const changeImportantCheck = document.getElementById(UI_SELECTORS.CHANGE_IMPORTANT_CHECK);
  const editDialog = document.querySelector(".edit-dialog");

  if (!editTextField || !changeImportantCheck || !editDialog) return;

  const newContent = editTextField.value.trim();
  if (!newContent) {
    snackbar("通知内容不能为空", 1500, "bottom-end");
    return;
  }

  const newIsImportant = changeImportantCheck.checked;
  setIsDialogClosing(true);

  const currentId = getCurrentPlayingNotifyId();
  if (currentId) {
    updateNotification(currentId, newContent, newIsImportant);
  }

  // 关闭弹窗并重置
  editDialog.open = false;
  editTextField.value = "";
  changeImportantCheck.checked = false;

  // 恢复轮播
  if (!getIsCarouselRunning()) {
    setTimeout(() => {
      toggleCarousel();
      setIsDialogClosing(false);
    }, 300);
  } else {
    setIsDialogClosing(false);
  }
  
  displayMessages();
};

// 处理编辑弹窗关闭
const handleEditDialogClose = () => {
  const isClosing = getIsDialogClosing();
  if (isClosing) {
    setIsDialogClosing(false);
    return;
  }

  // 重置弹窗内容
  const editTextField = document.getElementById("editMsgContent");
  const changeImportantCheck = document.getElementById(UI_SELECTORS.CHANGE_IMPORTANT_CHECK);
  if (editTextField) editTextField.value = "";
  if (changeImportantCheck) changeImportantCheck.checked = false;

  // 恢复轮播
  if (!getIsCarouselRunning()) {
    setTimeout(() => {
      toggleCarousel();
    }, 300);
  }
};

// 删除当前播放的通知
const deleteCurrentNotification = () => {
  const notifications = getNotifications();
  if (notifications.length === 0) {
    snackbar("没有通知可删除", 1500, "bottom-end");
    return;
  }

  let currentId = getCurrentPlayingNotifyId();
  // 兜底匹配当前显示的通知
  if (!currentId) {
    const showListElements = document.querySelectorAll(UI_SELECTORS.SHOW_LIST_ELEMENTS);
    const currentContent = showListElements[0]?.textContent.trim();
    const currentNotify = notifications.find(
      (notify) => notify.content.trim() === currentContent,
    );
    currentId = currentNotify ? currentNotify.id : notifications[0].id;
  }

  deleteNotification(currentId);
  setCurrentPlayingNotifyId(null);
  displayMessages();
};