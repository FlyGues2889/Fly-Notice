import { 
  getNotifications, 
  getCurrentIndex, 
  setCurrentIndex,
  getCurrentPlayingNotifyId,
  setCurrentPlayingNotifyId
} from "./notificationManager.js";
import { updateNotificationDisplay } from "./uiManager.js";
import { snackbar } from "./utils.js";
import { UI_SELECTORS, STORAGE_KEYS } from "./constants.js";
import { saveSettings, loadSettings } from "./storage.js";

let isCarouselRunning = true;
let messageInterval = null;
let lastSwitchSecond = -1;

export const getIsCarouselRunning = () => isCarouselRunning;
export const getLastSwitchSecond = () => lastSwitchSecond;
export const setLastSwitchSecond = (value) => { lastSwitchSecond = value; };

export const toggleCarousel = (isSlient) => {
  isCarouselRunning = !isCarouselRunning;

  const carouselToggleBtn = document.getElementById(UI_SELECTORS.CAROUSEL_TOGGLE_BTN);
  const prevBtn = document.getElementById(UI_SELECTORS.PREV_BTN);
  const nextBtn = document.getElementById(UI_SELECTORS.NEXT_BTN);
  const notifications = getNotifications();

  if (carouselToggleBtn) {
    if (isCarouselRunning) {
      carouselToggleBtn.innerHTML =
        '<span class="material-symbols-rounded">lock</span>';
      carouselToggleBtn.style.color = "rgba(var(--mdui-color-secondary))";

      const isDisabled = notifications.length <= 1;
      if (prevBtn && nextBtn) {
        prevBtn.disabled = isDisabled;
        nextBtn.disabled = isDisabled;
        prevBtn.style.display = isDisabled ? "none" : "";
        nextBtn.style.display = isDisabled ? "none" : "";
      }
    } else {
      carouselToggleBtn.innerHTML =
        '<span class="material-symbols-rounded-fill">no_encryption</span>';
      carouselToggleBtn.style.color = "rgba(var(--mdui-color-secondary))";

      if (prevBtn && nextBtn) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        const isDisabled = notifications.length <= 1;
        prevBtn.style.display = isDisabled ? "none" : "";
        nextBtn.style.display = isDisabled ? "none" : "";
      }
    }
  }

  if (isSlient === "slient") {
    snackbar(
      isCarouselRunning ? "已继续通知轮播" : "已暂停通知轮播",
      1000,
      "bottom-end",
    );
  }

  if (isCarouselRunning) {
    lastSwitchSecond = new Date().getSeconds();
  }
};

export const displayMessages = () => {
  const screenSaver = document.getElementById(UI_SELECTORS.SCREEN_SAVER);
  if (screenSaver && screenSaver.style.display === "flex") return;

  const showListElements = document.querySelectorAll(UI_SELECTORS.SHOW_LIST_ELEMENTS);
  if (showListElements.length === 0) {
    snackbar("没有找到可以显示的消息内容", 3000, "bottom-end");
    return;
  }

  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }

  const notifications = getNotifications();
  if (notifications.length === 0) {
    showListElements.forEach((el) => {
      el.innerHTML =
        '<span class="material-symbols-rounded" style="font-size: 3.2rem;font-weight:600">notifications_off</span>';
      el.style.opacity = "0.2";
      el.style.flexDirection = "column";
      el.style.color = "";
    });
    document.querySelectorAll("mdui-list-item").forEach((item) => {
      item.removeAttribute("active");
    });
    return;
  }

  const overviewList = document.querySelector(UI_SELECTORS.OVERVIEW_LIST);
  const scrollTimeSlider = document.getElementById(UI_SELECTORS.SCROLL_TIME_SLIDER);
  let currentIndex = getCurrentIndex();

  if (!overviewList || !scrollTimeSlider) return;
  const overviewItems = overviewList.querySelectorAll("mdui-list-item");

  showListElements.forEach((el) => {
    el.textContent = notifications[currentIndex].content;
    el.style.color = notifications[currentIndex].isImportant 
      ? "rgb(var(--mdui-color-primary))" 
      : "";
  });

  overviewItems.forEach((item) => {
    item.removeAttribute("active");
  });
  if (overviewItems[currentIndex]) {
    overviewItems[currentIndex].setAttribute("active", "");
  }

  lastSwitchSecond = new Date().getSeconds();
  const initialScrollTime = parseInt(scrollTimeSlider.value);
  saveSettings(STORAGE_KEYS.SCROLL_TIME, initialScrollTime);

  scrollTimeSlider.oninput = () => {
    const newScrollTime = parseInt(scrollTimeSlider.value);
    saveSettings(STORAGE_KEYS.SCROLL_TIME, newScrollTime);
    lastSwitchSecond = new Date().getSeconds();
  };

  messageInterval = setInterval(() => {
    if (!isCarouselRunning) return;

    const now = new Date();
    const currentSecond = now.getSeconds();
    const scrollTime = parseInt(scrollTimeSlider.value);
    const secondDiff = (currentSecond - lastSwitchSecond + 60) % 60;

    if (secondDiff >= scrollTime) {
      showListElements.forEach((el) => {
        el.textContent = notifications[currentIndex].content;
        el.style.color = notifications[currentIndex].isImportant 
          ? "rgb(var(--mdui-color-primary))" 
          : "";
      });

      overviewItems.forEach((item) => {
        item.removeAttribute("active");
      });
      if (overviewItems[currentIndex]) {
        overviewItems[currentIndex].setAttribute("active", "");
      }

      setCurrentPlayingNotifyId(notifications[currentIndex].id);

      currentIndex = (currentIndex + 1) % notifications.length;
      setCurrentIndex(currentIndex);
      lastSwitchSecond = currentSecond;
    }
  }, 100);
};

export const showPrevNotification = () => {
  const notifications = getNotifications();
  if (notifications.length === 0) {
    snackbar("暂无通知可切换", 1500, "bottom-end");
    return;
  }

  if (isCarouselRunning) {
    toggleCarousel();
  }

  let currentIndex = getCurrentIndex();
  currentIndex = (currentIndex - 1 + notifications.length) % notifications.length;
  setCurrentIndex(currentIndex);

  updateNotificationDisplay(currentIndex);
  lastSwitchSecond = new Date().getSeconds();

  snackbar("已切换到上一条通知，轮播已暂停", 1000, "bottom-end");
};

export const showNextNotification = () => {
  const notifications = getNotifications();
  if (notifications.length === 0) {
    snackbar("暂无通知可切换", 1500, "bottom-end");
    return;
  }

  if (isCarouselRunning) {
    toggleCarousel();
  }

  let currentIndex = getCurrentIndex();
  currentIndex = (currentIndex + 1) % notifications.length;
  setCurrentIndex(currentIndex);

  updateNotificationDisplay(currentIndex);
  lastSwitchSecond = new Date().getSeconds();

  snackbar("已切换到下一条通知，轮播已暂停", 1000, "bottom-end");
};

export const destroyCarousel = () => {
  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }
};