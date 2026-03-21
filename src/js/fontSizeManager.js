import { STORAGE_KEYS, FONT_SIZE, UI_SELECTORS } from "./constants.js";
import { saveSettings, loadSettings } from "./storage.js";

export const getCurrentFontSize = () => {
  return parseFloat(loadSettings(STORAGE_KEYS.FONT_SIZE, FONT_SIZE.DEFAULT.toString()));
};

export const updateFontSize = (value) => {
  const clampedValue = Math.max(FONT_SIZE.MIN, Math.min(FONT_SIZE.MAX, value));
  const steppedValue = Math.round(clampedValue * 10) / 10;
  saveSettings(STORAGE_KEYS.FONT_SIZE, steppedValue.toString());

  syncAllSliders(steppedValue);

  const fontSizeValue = steppedValue + "rem";
  const msgCards = document.querySelectorAll("mdui-card.msgCard");
  const viewCard = document.querySelector("mdui-card.viewCard");
  const showListElements = document.querySelectorAll(UI_SELECTORS.SHOW_LIST_ELEMENTS);

  msgCards.forEach((card) => (card.style.fontSize = fontSizeValue));
  if (viewCard) viewCard.style.fontSize = fontSizeValue;
  showListElements.forEach((el) => (el.style.fontSize = fontSizeValue));
};

const syncAllSliders = (targetValue) => {
  const targetPercent = ((targetValue - FONT_SIZE.MIN) / (FONT_SIZE.MAX - FONT_SIZE.MIN)) * 100;
  const customSliders = document.querySelectorAll(UI_SELECTORS.CUSTOM_SLIDERS);
  customSliders.forEach((slider) => {
    slider.style.setProperty("--active-width", `${targetPercent}%`);
  });
};

export const initCustomSliders = () => {
  const initialSize = getCurrentFontSize();
  syncAllSliders(initialSize);

  const customSliders = document.querySelectorAll(UI_SELECTORS.CUSTOM_SLIDERS);
  customSliders.forEach((slider) => {
    initSliderEvents(slider);
  });
};

const initSliderEvents = (slider) => {
  const controlBtn = slider.querySelector(".control-btn");
  let isDragging = false;

  const calculatePercent = (event) => {
    const rect = slider.getBoundingClientRect();
    const clientX = event.type.startsWith("touch")
      ? event.touches[0].clientX
      : event.clientX;

    let percent = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(0, Math.min(100, percent));
  };

  const handleSliderChange = (event) => {
    const newPercent = calculatePercent(event);
    const newValue = FONT_SIZE.MIN + (newPercent / 100) * (FONT_SIZE.MAX - FONT_SIZE.MIN);
    updateFontSize(newValue);
  };

  const startDrag = (event) => {
    isDragging = true;
    slider.classList.add("dragging");
    event.preventDefault();
  };

  const drag = (event) => {
    if (isDragging) handleSliderChange(event);
  };

  const endDrag = () => {
    isDragging = false;
    slider.classList.remove("dragging");
  };

  const handleClick = (event) => {
    if (!isDragging) handleSliderChange(event);
    event.stopPropagation();
  };

  if (controlBtn) {
    controlBtn.addEventListener("mousedown", startDrag);
    controlBtn.addEventListener("touchstart", startDrag);
  }
  document.addEventListener("mousemove", drag);
  document.addEventListener("touchmove", drag);
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchend", endDrag);
  slider.addEventListener("click", handleClick);
};

export const initFontSize = () => {
  updateFontSize(getCurrentFontSize());
};