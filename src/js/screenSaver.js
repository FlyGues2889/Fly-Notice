import { getNotifications } from "./notificationManager.js";
import { snackbar } from "./utils.js";
import { UI_SELECTORS } from "./constants.js";

let exitFullscreen = false;

const handleFullScreen = () => {
  const element = document.documentElement;

  if (document.fullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } else {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullScreen) {
      element.webkitRequestFullScreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }
};

export const toggleScreenSaver = () => {
  const screenSaver = document.getElementById(UI_SELECTORS.SCREEN_SAVER);
  if (!screenSaver) return;
  
  if (screenSaver.style.display === "block") {
    screenSaver.classList.remove("active");
    handleFullScreen();
    setTimeout(() => {
      screenSaver.style.display = "none";
    }, 800);
  } else {
    screenSaver.style.display = "block";
    void screenSaver.offsetWidth;
    screenSaver.classList.add("active");

    updateScreensaverCount();
    setInterval(updateDateTime, 100);
    handleFullScreen();

    setTimeout(() => {
      snackbar(
        "<b>息屏显示已启用</b><br><small>点击屏幕正下方按钮退出到正常窗口</small>",
        5000,
        "top-end",
      );
    }, 500);
  }
};

const updateDateTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const timeDisplay = document.getElementById(UI_SELECTORS.TIME_DISPLAY);
  if (timeDisplay) {
    timeDisplay.textContent = `${hours}:${minutes}`;
  }
};

export const updateScreensaverCount = () => {
  const screensaverCountDisplay = document.getElementById(UI_SELECTORS.COUNT_DISPLAY);
  const notifications = getNotifications();
  if (screensaverCountDisplay) {
    screensaverCountDisplay.textContent = `共 ${notifications.length} 条通知`;
  }
};