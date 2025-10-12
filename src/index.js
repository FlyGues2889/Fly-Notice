// ========================= 1. 核心数据结构：使用数组对象存储所有通知 =========================
// 通知数组 - 所有通知统一存储在这里
let notifications = [];
// 生成唯一ID的工具函数
const generateUniqueId = () =>
  `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// ========================= 2. 常量定义 =========================
const STORAGE_KEYS = {
  SCROLL_TIME: "scrollTime",
  FONT_SIZE: "fontSize",
  NOTIFICATIONS: "notifications", // 用于本地存储通知数据
};

// ========================= 3. DOM元素获取 =========================
// 主界面元素
const loadingLayer = document.getElementById("loading-layer");
const navigationRail = document.getElementById("navigation-rail");
const pages = document.querySelectorAll(".page");
const textField = document.getElementById("excludeNums");
const addButton = document.querySelector(".add-button");
const checkImportant = document.getElementById("check-important-msg");
// 替换mdui-slider为自定义滑块
const customSliders = document.querySelectorAll(".slideBtn"); // 获取所有自定义滑块
const listContainerSwitch = document.getElementById("list-container-switch");
const openAddDialogButton = document.querySelector(".openAddDialogBtn");
const msgList = document.querySelector(".msgList");
const overviewList = document.querySelector(".overviewList");
const listContainer = document.querySelector(".list-container");
const showListElements = document.querySelectorAll("#showList");
const unreadCount = document.getElementById("unreadCount");
const countDisplay = document.getElementById("count-display");
const carouselToggleBtn = document.querySelector(".carousel-toggle-btn");
const deleteBtn = document.querySelector(".deleteMsgBtn");
const closeEditBtn = document.querySelector(".close-edit-dialog");
// 新增：获取修改弹窗中的重要性复选框
const changeImportantCheck = document.getElementById("change-important-msg");
let isDialogClosing = false; // 标记弹窗是否正在关闭

// 轮播相关变量
let isCarouselRunning = true;
let messageInterval;
let lastSwitchSecond = -1;

// 息屏显示相关元素
const toggleButton = document.getElementById("open-nodisturb");
const screenSaver = document.getElementById("no-disturb-screen");
const exitButton = document.getElementById("exit-screensaver");
const timeDisplay = document.getElementById("time-display");
const screensaverCountDisplay = document.getElementById("screensaver-count"); // 息屏模式下的通知计数

// ========================= 4. 工具函数 =========================
function alert(icon, title, message) {
  mdui.alert({
    icon: icon,
    headline: title,
    description: message,
    confirmText: "确定",
    onConfirm: () => console.log("confirmed"),
  });
}

function snackbar(message, closeTime, placement) {
  mdui.snackbar({
    message: message,
    autoCloseDelay: closeTime,
    placement: placement,
  });
}

function showTime() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const current = `${month}-${day}&nbsp;&nbsp;${hour}:${minute}:${seconds}`;
  document.getElementById("time").innerHTML = current;
  openAddDialogButton.removeAttribute("loading");
}

// ========================= 5. 全屏与息屏显示功能 =========================
let exitFullscreen = false;

function handleFullScreen() {
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
}

window.onresize = function () {
  const isFull = !!document.fullscreenElement;
  if (isFull === false) {
    $("#exitFullScreen").css("display", "none");
    $("#fullScreen").css("display", "");
  } else {
    $("#exitFullScreen").css("display", "");
    $("#fullScreen").css("display", "none");
  }
};

// 切换息屏显示状态
toggleButton.addEventListener("click", toggleScreenSaver);
exitButton.addEventListener("click", toggleScreenSaver);

function toggleScreenSaver() {
  if (screenSaver.style.display === "block") {
    // 关闭息屏显示
    screenSaver.classList.remove("active");
    handleFullScreen();
    setTimeout(() => {
      screenSaver.style.display = "none";
    }, 800);
  } else {
    // 开启息屏显示
    screenSaver.style.display = "block";
    void screenSaver.offsetWidth;
    screenSaver.classList.add("active");

    updateScreensaverCount();
    setInterval(updateDateTime, 100);
    handleFullScreen();

    setTimeout(() => {
      snackbar(
        "<b>息屏显示已启用</b><br><small>点击屏幕正下方按钮退出到正常窗口。</small>",
        5000,
        "top-end"
      );
    }, 500);
  }
}

function updateDateTime() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  timeDisplay.textContent = `${hours}:${minutes}`;
}

// 更新息屏模式下的通知数量显示
function updateScreensaverCount() {
  if (screensaverCountDisplay) {
    screensaverCountDisplay.textContent = `通知数量: ${notifications.length}`;
  }
}

// ========================= 6. 页面导航 =========================
function navigate(pageId) {
  pages.forEach((page) => {
    page.style.display = "none";
  });
  document.getElementById(pageId).style.display = "block";

  const navigationItems = document.querySelectorAll(
    "mdui-navigation-rail-item"
  );
  navigationItems.forEach((item) => {
    item.removeAttribute("active");
  });

  if (pageId === "mainPage") {
    document.getElementById("toMain").setAttribute("active", "");
  } else if (pageId === "listPage") {
    document.getElementById("toList").setAttribute("active", "");
  } else if (pageId === "settingPage") {
    document.getElementById("toSettings").setAttribute("active", "");
  }
}

document.getElementById("toSettings").onclick = function () {
  navigate("settingPage");
};

// ========================= 7. 通知管理核心功能 =========================
/**
 * 添加新通知
 * @param {string} content - 通知内容
 */
function addNotification(content) {
  if (!content.trim()) return;

  // 获取重要性复选框状态
  const isImportant = document.getElementById("check-important-msg").checked;

  // 创建新通知对象，增加isImportant属性
  const newNotification = {
    id: generateUniqueId(),
    content: content,
    createTime: new Date().toISOString(),
    isImportant: isImportant, // 记录是否为重要通知
  };

  // 添加到通知数组
  notifications.push(newNotification);

  // 保存到本地存储
  saveNotificationsToLocalStorage();

  // 重新渲染
  renderNotifications();

  // 如果在息屏模式，更新计数
  if (screenSaver.style.display === "flex") {
    updateScreensaverCount();
  }

  // 提示与重置
  snackbar("已添加新通知。", 1000, "bottom");
  textField.value = "";
  // 重置复选框状态
  document.getElementById("check-important-msg").checked = false;
  openAddDialogButton.removeAttribute("extended");
  displayMessages();
}

/**
 * 删除通知
 * @param {string} id - 通知ID
 */
function deleteNotification(id) {
  // 从数组中删除
  notifications = notifications.filter(
    (notification) => notification.id !== id
  );

  // 保存到本地存储
  saveNotificationsToLocalStorage();

  // 重新渲染
  renderNotifications();

  // 如果在息屏模式，更新计数
  if (screenSaver.style.display === "flex") {
    updateScreensaverCount();
  }

  // 提示
  snackbar("通知已删除", 1000, "bottom");
  displayMessages();
}

/**
 * 更新通知内容（支持更新重要性状态）
 * @param {string} id - 通知ID
 * @param {string} newContent - 新内容
 * @param {boolean} newIsImportant - 新的重要性状态
 */
function updateNotification(id, newContent, newIsImportant) {
  if (!newContent.trim()) return;

  // 找到并更新通知
  const index = notifications.findIndex(
    (notification) => notification.id === id
  );
  if (index !== -1) {
    notifications[index].content = newContent;
    notifications[index].createTime = new Date().toISOString();
    // 更新重要性状态
    notifications[index].isImportant = newIsImportant;

    // 保存到本地存储
    saveNotificationsToLocalStorage();

    // 重新渲染
    renderNotifications();

    // 提示
    snackbar("通知已更新", 1000, "bottom");
    displayMessages();
  }
}

function renderNotifications() {
  // 清空现有内容
  msgList.innerHTML = "";
  overviewList.innerHTML = "";

  // 更新计数
  const notificationCount = notifications.length;
  unreadCount.textContent = notificationCount;
  countDisplay.textContent = `${notificationCount} 条通知在队列中`;

  // 无通知时显示空状态
  if (notificationCount === 0) {
    // 为msgList添加空状态图标
    const emptyState = document.createElement("div");
    emptyState.style.display = "flex";
    emptyState.style.justifyContent = "center";
    emptyState.style.alignItems = "center";
    emptyState.style.height = "200px"; // 设置合适的高度
    emptyState.style.opacity = "0.2";

    emptyState.innerHTML =
      '<span class="material-symbols-rounded" style="font-size: 3.2rem;font-weight: 600;position: absolute;top: 50%;left: 50%;transform: translate(calc(-50% - 1rem), calc(-50% - 1rem));">notifications_off</span>';
    msgList.appendChild(emptyState);

    // 其他区域的空状态处理
    showListElements.forEach((el) => {
      el.innerHTML =
        '<span class="material-symbols-rounded" style="font-size: 3.2rem;">notifications_off</span>';
      el.style.opacity = "0.2";
      el.style.flexDirection = "column";
      // 重置颜色
      el.style.color = "";
    });
    return;
  }

  // 有通知时渲染
  const savedFontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || 1;
  const currentFontSize = savedFontSize + "rem";
  const primaryColor = "rgb(var(--mdui-color-primary))";

  notifications.forEach((notification) => {
    // 渲染主通知卡片
    const card = document.createElement("mdui-card");
    card.className = "msgCard";
    card.dataset.id = notification.id;
    card.style.margin = "0.25rem 0.25rem 0 0 ";
    card.style.width = "calc(100% - 1.5rem - 0.25rem)";
    card.style.padding = "1rem 1rem 2.4rem 1rem";
    card.style.fontFamily = "Harmony Sans SC M";
    card.variant = "outlined";

    if (notification.isImportant) {
      card.style.border = `0.15rem solid rgba(var(--mdui-color-primary),0.2)`;
      card.style.color = primaryColor;
      card.style.backgroundColor =
        "rgba(var(--mdui-color-primary-container),0.1)";
    } else {
      card.style.border = "0.15rem solid rgba(var(--mdui-color-secondary),0.2)";
      card.style.color = "";
      card.style.backgroundColor =
        "rgba(var(--mdui-color-surface-container),0.3)";
    }

    card.style.borderRadius = "var(--mdui-shape-corner-large)";
    card.style.fontSize = currentFontSize;

    // 卡片内容
    const cardContent = document.createElement("mdui-card-content");
    cardContent.style.whiteSpace = "pre-wrap";
    cardContent.style.overflowWrap = "break-word";
    cardContent.textContent = notification.content;

    // 卡片操作按钮
    const cardActions = document.createElement("mdui-card-actions");
    cardActions.style.justifyContent = "flex-end";
    cardActions.style.gap = "0.5rem";

    // 编辑按钮
    const editBtn = document.createElement("mdui-button-icon");
    editBtn.innerHTML = '<span class="material-symbols-rounded">edit</span>';
    editBtn.style.position = "absolute";
    editBtn.style.right = "3.1rem";
    editBtn.style.bottom = "0";
    editBtn.style.color = "rgba(var(--mdui-color-secondary),0.5)";
    editBtn.addEventListener("click", () => {
      if (isCarouselRunning) {
        toggleCarousel();
      }

      const editDialog = document.querySelector(".edit-dialog");
      const editTextField = document.getElementById("editMsgContent");

      currentPlayingNotifyId = notification.id;
      editTextField.value = notification.content;
      // 同步当前通知的重要性状态到修改弹窗
      changeImportantCheck.checked = notification.isImportant;

      isDialogClosing = false;
      editDialog.open = true;
    });

    // 删除按钮
    const deleteBtn = document.createElement("mdui-button-icon");
    deleteBtn.innerHTML =
      '<span class="material-symbols-rounded">delete</span>';
    deleteBtn.style.position = "absolute";
    deleteBtn.style.right = "1rem";
    deleteBtn.style.bottom = "0";
    deleteBtn.style.color = "rgba(var(--mdui-color-secondary),0.5)";
    deleteBtn.addEventListener("click", () => {
      deleteNotification(notification.id);
    });

    // 重要通知标注按钮
    const importantMark = document.createElement("mdui-button-icon");
    importantMark.innerHTML =
      '<span class="material-symbols-rounded-fill">flag</span>';
    importantMark.style.position = "absolute";
    importantMark.style.left = "1rem";
    importantMark.style.bottom = "0";
    importantMark.style.color = "rgba(var(--mdui-color-primary),0.5)";

    if (notification.isImportant) {
      cardActions.appendChild(importantMark);
    }
    cardActions.appendChild(editBtn);
    cardActions.appendChild(deleteBtn);
    card.appendChild(cardContent);
    card.appendChild(cardActions);
    msgList.appendChild(card);

    // 渲染侧边栏概览项
    const overviewMaxLength = 16;
    let displayText = notification.content;
    if (displayText.length > overviewMaxLength) {
      displayText = displayText.substring(0, overviewMaxLength) + "...";
    }

    const overviewItem = document.createElement("mdui-list-item");
    overviewItem.dataset.id = notification.id;
    overviewItem.description = displayText;
    overviewItem.style.margin = "0.5rem 0 0 0";
    overviewItem.style.padding = "0 0.25rem";
    overviewItem.style.borderRadius = "var(--mdui-shape-corner-large)";
    if (notification.isImportant) {
      overviewItem.style.color = primaryColor;
    }
    overviewList.appendChild(overviewItem);
  });

  // 更新显示区域，应用重要通知颜色
  showListElements.forEach((el) => {
    el.style.opacity = "1";
    el.style.flexDirection = "row";
    el.textContent = notifications[0].content;
    // 应用重要通知颜色
    if (notifications[0].isImportant) {
      el.style.color = "rgb(var(--mdui-color-primary))";
    } else {
      el.style.color = ""; // 使用默认颜色
    }
  });
}

// ========================= 8. 本地存储操作 =========================
/**
 * 保存通知到本地存储
 */
function saveNotificationsToLocalStorage() {
  localStorage.setItem(
    STORAGE_KEYS.NOTIFICATIONS,
    JSON.stringify(notifications)
  );
}

/**
 * 从本地存储加载通知
 */
function loadNotificationsFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (saved) {
    try {
      notifications = JSON.parse(saved);
    } catch (e) {
      console.error("错误：加载通知失败。", e);
      notifications = [];
    }
  }
}

// ========================= 9. 轮播控制功能 =========================
function toggleCarousel() {
  isCarouselRunning = !isCarouselRunning;

  if (carouselToggleBtn) {
    // 先判断按钮是否存在，避免报错
    if (isCarouselRunning) {
      carouselToggleBtn.innerHTML =
        '<span class="material-symbols-rounded">lock</span>';
    } else {
      carouselToggleBtn.innerHTML =
        '<span class="material-symbols-rounded">no_encryption</span>';
    }
  }

  if (notifications.length > 0) {
    snackbar(
      isCarouselRunning ? "已继续通知轮播" : "已暂停通知轮播",
      1500,
      "bottom"
    );
  }

  if (isCarouselRunning) {
    lastSwitchSecond = new Date().getSeconds();
  }
}

function displayMessages() {
  if (screenSaver.style.display === "flex") return;

  if (showListElements.length === 0) {
    snackbar("错误：没有找到可以显示的消息内容。", 3000, "bottom");
    return;
  }

  // 清除现有定时器
  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }

  // 无通知时处理
  if (notifications.length === 0) {
    showListElements.forEach((el) => {
      el.innerHTML =
        '<span class="material-symbols-rounded" style="font-size: 3.2rem;font-weight:600">notifications_off</span>';
      el.style.opacity = "0.2";
      el.style.flexDirection = "column";
      el.style.color = ""; // 重置颜色
    });
    document.querySelectorAll("mdui-list-item").forEach((item) => {
      item.removeAttribute("active");
    });
    return;
  }

  // 初始化轮播状态
  let currentIndex = 0;
  const overviewItems = overviewList.querySelectorAll("mdui-list-item");
  const scrollTimeSlider = document.getElementById("msgScrollTime");

  // 显示第一条通知
  showListElements.forEach((el) => {
    el.textContent = notifications[currentIndex].content;
    // 应用重要通知颜色
    if (notifications[currentIndex].isImportant) {
      el.style.color = "rgb(var(--mdui-color-primary))";
    } else {
      el.style.color = ""; // 使用默认颜色
    }
  });

  // 更新侧边栏激活状态
  overviewItems.forEach((item) => {
    item.removeAttribute("active");
  });
  if (overviewItems[currentIndex]) {
    overviewItems[currentIndex].setAttribute("active", "");
  }

  // 准备下一条索引
  currentIndex = (currentIndex + 1) % notifications.length;
  lastSwitchSecond = new Date().getSeconds();

  // 保存初始滚动时间
  const initialScrollTime = parseInt(scrollTimeSlider.value);
  localStorage.setItem(STORAGE_KEYS.SCROLL_TIME, initialScrollTime);

  // 监听滚动时间变化
  scrollTimeSlider.addEventListener("input", () => {
    const newScrollTime = parseInt(scrollTimeSlider.value);
    localStorage.setItem(STORAGE_KEYS.SCROLL_TIME, newScrollTime);
    lastSwitchSecond = new Date().getSeconds();
  });

  // 启动轮播定时器
  messageInterval = setInterval(() => {
    // 如果轮播已停止，则不执行切换
    if (!isCarouselRunning) return;

    const now = new Date();
    const currentSecond = now.getSeconds();
    const scrollTime = parseInt(scrollTimeSlider.value);
    const secondDiff = (currentSecond - lastSwitchSecond + 60) % 60;

    if (secondDiff >= scrollTime) {
      // 更新显示内容
      showListElements.forEach((el) => {
        el.textContent = notifications[currentIndex].content;
        // 应用重要通知颜色
        if (notifications[currentIndex].isImportant) {
          el.style.color = "rgb(var(--mdui-color-primary))";
        } else {
          el.style.color = ""; // 使用默认颜色
        }
      });

      // 更新侧边栏激活状态
      overviewItems.forEach((item) => {
        item.removeAttribute("active");
      });
      if (overviewItems[currentIndex]) {
        overviewItems[currentIndex].setAttribute("active", "");
      }

      // 更新当前播放的通知ID
      currentPlayingNotifyId = notifications[currentIndex].id;

      // 计算下一个索引
      currentIndex = (currentIndex + 1) % notifications.length;
      lastSwitchSecond = currentSecond;
    }
  }, 100);
}

// ========================= 10. 字体大小设置（适配自定义滑块） =========================
function initCustomSliders() {
  const savedFontSize =
    parseFloat(localStorage.getItem(STORAGE_KEYS.FONT_SIZE)) || 1;

  // 初始化所有滑块
  customSliders.forEach((slider) => {
    // 设置滑块初始位置
    const percent = ((savedFontSize - 1) / (5 - 1)) * 100;
    slider.style.setProperty("--active-width", `${percent}%`);

    // 为每个滑块添加事件监听
    initSliderEvents(slider);
  });

  // 应用初始字体大小
  updateFontSizeDisplay(savedFontSize);
}
// 为滑块添加事件处理
function initSliderEvents(slider) {
  const controlBtn = slider.querySelector(".control-btn");
  let isDragging = false;

  // 计算滑块值的辅助函数
  function getValueFromSlider(sliderEl) {
    const percent = parseFloat(
      getComputedStyle(sliderEl).getPropertyValue("--active-width")
    );
    // 将0-100%转换为1-5的范围
    return 1 + (percent / 100) * 4;
  }

  // 计算滑块百分比的辅助函数
  function getPercentFromValue(value) {
    // 将1-5转换为0-100%
    return ((value - 1) / 4) * 100;
  }

  // 计算点击位置对应的百分比
  function calculatePercent(event) {
    const rect = slider.getBoundingClientRect();
    let clientX;

    if (event.type.startsWith("touch")) {
      clientX = event.touches[0].clientX;
    } else {
      clientX = event.clientX;
    }

    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    // 应用步长0.1
    const value = 1 + (percent / 100) * 4;
    const steppedValue = Math.round(value / 0.1) * 0.1;
    return getPercentFromValue(steppedValue);
  }

  // 开始拖拽
  function startDrag(event) {
    isDragging = true;
    slider.classList.add("dragging");
    event.preventDefault();
  }

  // 拖拽过程
  function drag(event) {
    if (!isDragging) return;

    const newPercent = calculatePercent(event);
    slider.style.setProperty("--active-width", `${newPercent}%`);

    // 更新字体大小
    const currentValue = getValueFromSlider(slider);
    updateFontSizeDisplay(currentValue);
  }

  // 结束拖拽
  function endDrag() {
    isDragging = false;
    slider.classList.remove("dragging");

    // 保存设置
    const currentValue = getValueFromSlider(slider);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, currentValue.toString());
  }

  // 点击滑块
  function handleClick(event) {
    if (isDragging) return;

    const newPercent = calculatePercent(event);
    slider.style.setProperty("--active-width", `${newPercent}%`);

    // 更新字体大小
    const currentValue = getValueFromSlider(slider);
    updateFontSizeDisplay(currentValue);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, currentValue.toString());
  }

  // 绑定事件
  controlBtn.addEventListener("mousedown", startDrag);
  controlBtn.addEventListener("touchstart", startDrag);
  document.addEventListener("mousemove", drag);
  document.addEventListener("touchmove", drag);
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchend", endDrag);
  slider.addEventListener("click", handleClick);
  slider.addEventListener("click", (e) => e.stopPropagation());
}

// 初始化字体大小
function initFontSize() {
  // 从本地存储获取字体大小
  const savedFontSize =
    parseFloat(localStorage.getItem(STORAGE_KEYS.FONT_SIZE)) || 1;
  const fontSizeValue = savedFontSize + "rem";

  const msgCards = document.querySelectorAll("mdui-card.msgCard");
  const viewCard = document.querySelector("mdui-card.viewCard");
  const showListElements = document.querySelectorAll("#showList");

  msgCards.forEach((card) => {
    card.style.fontSize = fontSizeValue;
  });
  if (viewCard) {
    viewCard.style.fontSize = fontSizeValue;
  }
  showListElements.forEach((el) => {
    el.style.fontSize = fontSizeValue;
  });
}
// 更新字体大小显示
function updateFontSizeDisplay(value) {
  const fontSizeValue = value + "rem";

  const msgCards = document.querySelectorAll("mdui-card.msgCard");
  const viewCard = document.querySelector("mdui-card.viewCard");
  const showListElements = document.querySelectorAll("#showList");

  msgCards.forEach((card) => {
    card.style.fontSize = fontSizeValue;
  });
  if (viewCard) {
    viewCard.style.fontSize = fontSizeValue;
  }
  showListElements.forEach((el) => {
    el.style.fontSize = fontSizeValue;
  });
}

// ========================= 11. 侧边栏控制 =========================
function showListContainer() {
  const isHidden =
    listContainer.style.display === "none" ||
    listContainer.style.transform === "translateX(-100%)";

  if (isHidden) {
    // 显示侧边栏
    listContainer.style.display = "block";
    void listContainer.offsetWidth; // 触发重绘
    listContainer.style.transform = "translateX(0)";
    listContainer.style.opacity = "1";

    pages.forEach((page) => {
      page.style.transform = "translateX(14rem)";
      page.style.margin = "0rem 0rem 0rem 5rem";
      page.style.width = "calc(100vw - 5rem - 14rem - 5rem - 1rem)";
    });
    listContainerSwitch.innerHTML =
      '<span class="material-symbols-rounded">menu_open</span>';
  } else {
    // 隐藏侧边栏
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
}

// ========================= 12. 事件监听与初始化 =========================
// 添加通知按钮事件
addButton.addEventListener("click", () => {
  addNotification(textField.value);
});

// 页面加载初始化
window.onload = function () {
  // 初始化时间显示
  setInterval(showTime, 1000);
  showTime();

  // 加载设置
  loadSettings();

  // 初始化自定义滑块
  initCustomSliders();

  // 加载通知并渲染
  loadNotificationsFromLocalStorage();
  renderNotifications();

  // 初始化字体大小
  initFontSize();

  // 启动轮播
  displayMessages();

  initEditDialog();
  initDeleteButton();

  loadingLayer.style.display = "none";
};

// 加载配置设置
function loadSettings() {
  const scrollTime = localStorage.getItem(STORAGE_KEYS.SCROLL_TIME);
  if (scrollTime) {
    document.getElementById("msgScrollTime").value = scrollTime;
  }

  const fontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
  if (fontSize) {
    const fontSizeValue = parseFloat(fontSize);
    const percent = ((fontSizeValue - 1) / (5 - 1)) * 100;
    customSliders.forEach((slider) => {
      slider.style.setProperty("--active-width", `${percent}%`);
    });
  }
}
// 其他对话框功能
function openErrorDialog() {
  const errorSnackbar = document.querySelector(".errorSnackbar");
  errorSnackbar.open = true;
}

function openAddDialog() {
  const blockDialog = document.querySelector(".add-dialog");
  const closeButton2 = blockDialog.querySelector(".close-add-dialog");
  blockDialog.open = true;
  closeButton2.addEventListener("click", () => (blockDialog.open = false));
}

// ========================= 13. 修改当前播放通知相关功能 =========================
// 全局变量：记录当前正在播放的通知ID
let currentPlayingNotifyId = null;

/**
 * 打开修改弹窗（暂停轮播 + 填充当前播放内容）
 */
function openEditDialog() {
  // 若没有通知，直接提示并返回
  if (notifications.length === 0) {
    snackbar("暂无通知可修改。", 1500, "bottom");
    return;
  }

  // 暂停轮播
  if (isCarouselRunning) {
    toggleCarousel();
  }

  // 获取当前播放的通知内容和ID
  const editDialog = document.querySelector(".edit-dialog");
  const editTextField = document.getElementById("editMsgContent");
  // 从通知数组中匹配当前显示的内容
  const currentContent = showListElements[0]?.textContent.trim();
  const currentNotify = notifications.find(
    (notify) => notify.content.trim() === currentContent
  );

  if (currentNotify) {
    // 记录当前播放通知的ID
    currentPlayingNotifyId = currentNotify.id;
    // 填充弹窗输入框
    editTextField.value = currentNotify.content;
    // 同步重要性状态
    changeImportantCheck.checked = currentNotify.isImportant;
  } else {
    // 异常情况：未匹配到当前通知，填充第一个通知
    currentPlayingNotifyId = notifications[0].id;
    editTextField.value = notifications[0].content;
    changeImportantCheck.checked = notifications[0].isImportant;
  }

  // 打开弹窗
  editDialog.open = true;
}

function initEditDialog() {
  const editDialog = document.querySelector(".edit-dialog");
  const editTextField = document.getElementById("editMsgContent");

  // 点击“完成”按钮触发修改
  closeEditBtn.addEventListener("click", () => {
    const newContent = editTextField.value.trim();
    if (!newContent) {
      snackbar("错误：通知内容不能为空。", 1500, "bottom");
      return;
    }

    // 获取新的重要性状态
    const newIsImportant = changeImportantCheck.checked;

    // 标记弹窗开始关闭
    isDialogClosing = true;

    // 调用统一修改接口（传入新的重要性状态）
    if (currentPlayingNotifyId) {
      updateNotification(currentPlayingNotifyId, newContent, newIsImportant);
    }

    // 关闭弹窗 + 清空输入框
    editDialog.open = false;
    editTextField.value = "";
    changeImportantCheck.checked = false;

    // 恢复轮播
    if (!isCarouselRunning) {
      setTimeout(() => {
        toggleCarousel();
        isDialogClosing = false; // 重置标记
      }, 300);
    } else {
      isDialogClosing = false; // 重置标记
    }
  });

  // 弹窗关闭事件
  editDialog.addEventListener("close", () => {
    // 如果是通过完成按钮关闭的，这里不再处理
    if (isDialogClosing) {
      isDialogClosing = false;
      return;
    }

    // 清空输入框和复选框
    editTextField.value = "";
    changeImportantCheck.checked = false;

    // 恢复轮播
    if (!isCarouselRunning) {
      setTimeout(() => {
        toggleCarousel();
      }, 300);
    }
  });
}

function deleteCurrentNotification() {
  if (notifications.length === 0) {
    snackbar("没有通知可删除。", 1500, "bottom");
    return;
  }

  // 检查是否有当前播放的通知ID
  if (!currentPlayingNotifyId) {
    // 如果没有记录ID，尝试通过内容匹配
    const currentContent = showListElements[0]?.textContent.trim();
    const currentNotify = notifications.find(
      (notify) => notify.content.trim() === currentContent
    );
    if (currentNotify) {
      currentPlayingNotifyId = currentNotify.id;
    } else {
      // 如果也无法匹配内容，默认删除第一个通知
      currentPlayingNotifyId = notifications[0].id;
    }
  }

  // 执行删除
  deleteNotification(currentPlayingNotifyId);

  // 重置当前播放ID
  currentPlayingNotifyId = null;
}

// 初始化删除按钮事件
function initDeleteButton() {
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deleteCurrentNotification);
  }
}
