import { showTime } from "./js/utils.js";
import {
  loadNotificationsFromLocalStorage,
  loadSettings,
} from "./js/storage.js";
import { setNotifications } from "./js/notificationManager.js";
import { renderNotifications } from "./js/uiManager.js";
import { displayMessages } from "./js/carouselManager.js";
import { initCustomSliders, initFontSize } from "./js/fontSizeManager.js";
import { bindEvents } from "./js/eventBinder.js";
import { STORAGE_KEYS, UI_SELECTORS } from "./js/constants.js";

window.onload = function () {
  setInterval(showTime, 1000);
  showTime();

  loadAppSettings();
  bindEvents();
  initCustomSliders();

  const notifications = loadNotificationsFromLocalStorage();
  setNotifications(notifications);
  renderNotifications();

  initFontSize();
  displayMessages();

  const loadingLayer = document.getElementById(UI_SELECTORS.LOADING_LAYER);
  if (loadingLayer) {
    loadingLayer.style.display = "none";
  }
};

const loadAppSettings = () => {
  const scrollTime = loadSettings(STORAGE_KEYS.SCROLL_TIME);
  if (scrollTime) {
    const scrollTimeSlider = document.getElementById(
      UI_SELECTORS.SCROLL_TIME_SLIDER,
    );
    if (scrollTimeSlider) {
      scrollTimeSlider.value = scrollTime;
    }
  }

  const fontSize = loadSettings(STORAGE_KEYS.FONT_SIZE);
  if (fontSize) {
    const fontSizeValue = parseFloat(fontSize);
    const percent = ((fontSizeValue - 1) / (5 - 1)) * 100;
    const customSliders = document.querySelectorAll(
      UI_SELECTORS.CUSTOM_SLIDERS,
    );
    customSliders.forEach((slider) => {
      slider.style.setProperty("--active-width", `${percent}%`);
    });
  }
};
