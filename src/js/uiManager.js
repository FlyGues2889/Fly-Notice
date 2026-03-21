import { 
  getNotifications, 
  getCurrentIndex, 
  setCurrentIndex,
  getCurrentPlayingNotifyId,
  setCurrentPlayingNotifyId
} from "./notificationManager.js";
import { snackbar } from "./utils.js";
import { updateFontSize, getCurrentFontSize } from "./fontSizeManager.js";
import { UI_SELECTORS } from "./constants.js";

export const navigate = (pageId) => {
  const pages = document.querySelectorAll(UI_SELECTORS.PAGES);
  pages.forEach((page) => {
    page.style.display = "none";
  });
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.style.display = "block";
  }

  const navigationItems = document.querySelectorAll(
    "mdui-navigation-rail-item",
  );
  navigationItems.forEach((item) => {
    item.removeAttribute("active");
  });

  if (pageId === "mainPage") {
    document.getElementById(UI_SELECTORS.TO_MAIN)?.setAttribute("active", "");
  } else if (pageId === "listPage") {
    document.getElementById(UI_SELECTORS.TO_LIST)?.setAttribute("active", "");
  } else if (pageId === "settingPage") {
    document.getElementById(UI_SELECTORS.TO_SETTINGS)?.setAttribute("active", "");
  }
};

export const showListContainer = () => {
  const listContainer = document.querySelector(UI_SELECTORS.LIST_CONTAINER);
  const listContainerSwitch = document.getElementById(UI_SELECTORS.LIST_CONTAINER_SWITCH);
  const pages = document.querySelectorAll(UI_SELECTORS.PAGES);
  
  if (!listContainer || !listContainerSwitch) return;

  const isHidden =
    listContainer.style.display === "none" ||
    listContainer.style.transform === "translateX(-100%)";

  if (isHidden) {
    listContainer.style.display = "block";
    void listContainer.offsetWidth;
    listContainer.style.transform = "translateX(0)";
    listContainer.style.opacity = "1";

    pages.forEach((page) => {
      page.style.transform = "translateX(14rem)";
      page.style.margin = "0rem 0rem 0rem 5rem";
      page.style.width = "calc(100vw - 23rem)";
    });
    listContainerSwitch.innerHTML =
      '<span class="material-symbols-rounded">menu_open</span>';
  } else {
    listContainer.style.transform = "translateX(-100%)";
    listContainer.style.opacity = "0";

    pages.forEach((page) => {
      page.style.transform = "translateX(0)";
      page.style.margin = "0rem 0rem 0rem 5rem";
      page.style.width = "calc(100vw - 5rem)";
    });
    listContainerSwitch.innerHTML =
      '<span class="material-symbols-rounded">menu</span>';
    setTimeout(() => {
      listContainer.style.display = "none";
    }, 300);
  }
};

export const renderNotifications = () => {
  const notifications = getNotifications();
  const msgList = document.querySelector(UI_SELECTORS.MSG_LIST);
  const overviewList = document.querySelector(UI_SELECTORS.OVERVIEW_LIST);
  const showListElements = document.querySelectorAll(UI_SELECTORS.SHOW_LIST_ELEMENTS);
  const unreadCount = document.getElementById(UI_SELECTORS.UNREAD_COUNT);
  const countDisplay = document.getElementById(UI_SELECTORS.COUNT_DISPLAY);
  const prevBtn = document.getElementById(UI_SELECTORS.PREV_BTN);
  const nextBtn = document.getElementById(UI_SELECTORS.NEXT_BTN);
  let currentIndex = getCurrentIndex();

  if (!msgList || !overviewList) return;

  msgList.innerHTML = "";
  overviewList.innerHTML = "";

  const notificationCount = notifications.length;
  if (unreadCount) unreadCount.textContent = notificationCount;
  if (countDisplay) countDisplay.textContent = `共 ${notificationCount} 条通知`;

  if (notificationCount === 0) {
    const emptyState = document.createElement("div");
    emptyState.style.display = "flex";
    emptyState.style.justifyContent = "center";
    emptyState.style.alignItems = "center";
    emptyState.style.height = "200px";
    emptyState.style.opacity = "0.2";

    emptyState.innerHTML =
      '<span class="material-symbols-rounded" style="font-size: 3.2rem;font-weight: 600;position: absolute;top: 50%;left: 50%;transform: translate(calc(-50% - 1rem), calc(-50% - 1rem));">notifications_off</span>';
    msgList.appendChild(emptyState);

    showListElements.forEach((el) => {
      el.innerHTML =
        '<span class="material-symbols-rounded" style="font-size: 3.2rem;font-weight:600">notifications_off</span>';
      el.style.opacity = "0.2";
      el.style.flexDirection = "column";
      el.style.color = "";
    });
    
    if (prevBtn && nextBtn) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    }
    return;
  }

  const savedFontSize = getCurrentFontSize();
  const currentFontSize = savedFontSize + "rem";
  const primaryColor = "rgb(var(--mdui-color-primary))";

  notifications.forEach((notification, index) => {
    const card = document.createElement("mdui-card");
    card.className = "msgCard";
    card.dataset.id = notification.id;
    card.style.margin = "0.25rem 0.25rem 0 0 ";
    card.style.width = "calc(100% - 1.5rem - 0.25rem)";
    card.style.padding = "1rem 1rem 2.4rem 1rem";
    card.style.fontFamily = "Harmony Sans SC M";
    card.variant = "outlined";

    if (notification.isImportant) {
      card.style.border = `rgba(var(--mdui-color-primary), 0.5) solid 0.1rem`;
      card.style.color = primaryColor;
      card.style.backgroundColor =
        "rgba(var(--mdui-color-primary-container),0.1)";
    } else {
      card.style.border = "rgba(var(--mdui-color-secondary), 0.5) solid 0.1rem";
      card.style.color = "";
      card.style.backgroundColor =
        "rgba(var(--mdui-color-surface-container),0.3)";
    }

    card.style.borderRadius = "var(--mdui-shape-corner-large)";
    card.style.fontSize = currentFontSize;

    const cardContent = document.createElement("mdui-card-content");
    cardContent.style.whiteSpace = "pre-wrap";
    cardContent.style.overflowWrap = "break-word";
    cardContent.textContent = notification.content;

    const cardActions = document.createElement("mdui-card-actions");
    cardActions.style.justifyContent = "flex-end";
    cardActions.style.gap = "0.5rem";

    const editBtn = document.createElement("mdui-button-icon");
    editBtn.innerHTML = '<span class="material-symbols-rounded">edit</span>';
    editBtn.style.position = "absolute";
    editBtn.style.left = "3.1rem";
    editBtn.style.bottom = "0";
    editBtn.style.color = "rgba(var(--mdui-color-secondary),0.5)";
    editBtn.style.transform = "scale(0.8)";
    editBtn.addEventListener("click", () => {
      openEditDialog(notification);
    });

    const deleteBtn = document.createElement("mdui-button-icon");
    deleteBtn.className = "deleteMsgBtn";
    deleteBtn.innerHTML =
      '<span class="material-symbols-rounded">delete</span>';
    deleteBtn.style.position = "absolute";
    deleteBtn.style.left = "1rem";
    deleteBtn.style.bottom = "0";
    deleteBtn.style.color = "rgba(var(--mdui-color-secondary),0.5)";
    deleteBtn.style.transform = "scale(0.8)";
    deleteBtn.addEventListener("click", () => {
      const { deleteNotification } = import("./notificationManager.js");
      deleteNotification(notification.id);
    });

    const importantMark = document.createElement("mdui-button-icon");
    importantMark.innerHTML =
      '<span class="material-symbols-rounded-fill">flag</span>';
    importantMark.style.position = "absolute";
    importantMark.style.right = "1rem";
    importantMark.style.bottom = "0";
    importantMark.style.color = "rgba(var(--mdui-color-primary),0.5)";

    if (notification.isImportant) {
      cardActions.appendChild(importantMark);
      editBtn.style.color = "rgba(var(--mdui-color-primary),0.5)";
      deleteBtn.style.color = "rgba(var(--mdui-color-primary),0.5)";
    }
    cardActions.appendChild(editBtn);
    cardActions.appendChild(deleteBtn);
    card.appendChild(cardContent);
    card.appendChild(cardActions);
    msgList.appendChild(card);

    const overviewMaxLength = 16;
    let displayText = notification.content;
    if (displayText.length > overviewMaxLength) {
      displayText = displayText.substring(0, overviewMaxLength) + "...";
    }

    const overviewItem = document.createElement("mdui-list-item");
    overviewItem.className = "listItem";
    overviewItem.dataset.id = notification.id;
    overviewItem.dataset.index = index;
    overviewItem.description = displayText;
    overviewItem.style.margin = "0.5rem 0 0 0";
    overviewItem.style.padding = "0 0.25rem";
    overviewItem.style.borderRadius = "var(--mdui-shape-corner-large)";
    if (notification.isImportant) {
      overviewItem.style.color = primaryColor;
    }

    overviewItem.addEventListener("click", () => {
      jumpToNotification(index);
    });

    overviewList.appendChild(overviewItem);
  });

  showListElements.forEach((el) => {
    el.style.opacity = "1";
    el.style.flexDirection = "row";
    el.textContent = notifications[currentIndex].content;
    if (notifications[currentIndex].isImportant) {
      el.style.color = "rgb(var(--mdui-color-primary))";
    } else {
      el.style.color = "";
    }
  });

  const overviewItems = overviewList.querySelectorAll("mdui-list-item");
  overviewItems.forEach((item) => item.removeAttribute("active"));
  if (overviewItems[currentIndex] && notifications.length > 0) {
    overviewItems[currentIndex].setAttribute("active", "");
  }

  if (prevBtn && nextBtn) {
    const isDisabled = notifications.length <= 1;
    if (isDisabled) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    } else {
      prevBtn.style.display = "";
      nextBtn.style.display = "";
    }
  }
};

const jumpToNotification = (index) => {
  const notifications = getNotifications();
  if (index < 0 || index >= notifications.length) return;

  setCurrentIndex(index);
  updateNotificationDisplay(index);
  
  const { setLastSwitchSecond } = import("./carouselManager.js");
  setLastSwitchSecond(new Date().getSeconds());

  snackbar("已跳转到选中通知", 1000, "bottom-end");
};

export const updateNotificationDisplay = (index) => {
  const notifications = getNotifications();
  if (index < 0 || index >= notifications.length) return;

  const showListElements = document.querySelectorAll(UI_SELECTORS.SHOW_LIST_ELEMENTS);
  const overviewList = document.querySelector(UI_SELECTORS.OVERVIEW_LIST);

  if (!overviewList) return;

  showListElements.forEach((el) => {
    el.textContent = notifications[index].content;
    if (notifications[index].isImportant) {
      el.style.color = "rgb(var(--mdui-color-primary))";
    } else {
      el.style.color = "";
    }
  });

  const overviewItems = overviewList.querySelectorAll("mdui-list-item");
  overviewItems.forEach((item) => item.removeAttribute("active"));
  if (overviewItems[index]) {
    overviewItems[index].setAttribute("active", "");
  }

  setCurrentPlayingNotifyId(notifications[index].id);
};

const openEditDialog = (notification) => {
  const { toggleCarousel, getIsCarouselRunning } = import("./carouselManager.js");
  
  if (getIsCarouselRunning()) {
    toggleCarousel();
  }

  const editDialog = document.querySelector(".edit-dialog");
  const editTextField = document.getElementById("editMsgContent");
  const changeImportantCheck = document.getElementById(UI_SELECTORS.CHANGE_IMPORTANT_CHECK);

  if (!editDialog || !editTextField || !changeImportantCheck) return;

  setCurrentPlayingNotifyId(notification.id);
  editTextField.value = notification.content;
  changeImportantCheck.checked = notification.isImportant;

  const { setIsDialogClosing } = import("./notificationManager.js");
  setIsDialogClosing(false);
  editDialog.open = true;
};

export const openAddDialog = () => {
  const blockDialog = document.querySelector(".add-dialog");
  if (blockDialog) {
    blockDialog.open = true;
  }
};

export const openInfoDialog = () => {
  const infoDialog = document.querySelector(".info-dialog");
  if (infoDialog) {
    infoDialog.open = true;
  }
};