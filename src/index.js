const STORAGE_KEYS = {
  SCROLL_TIME: "scrollTime",
  FONT_SIZE: "fontSize",
};
const navigationRail = document.getElementById("navigation-rail");
const pages = document.querySelectorAll(".page");

const textField = document.getElementById("excludeNums");
const addButton = document.querySelector(".add-button");
const fontSizeSlider = document.querySelectorAll(".msgFontSize");
const listContainerSwitch = document.getElementById("list-container-switch");
const openAddDialogButton = document.querySelector(".openBlockBtn");

const msgList = document.querySelector(".msgList");
const overviewList = document.querySelector(".overviewList");
const listContainer = document.querySelector(".list-container");
const showListElements = document.querySelectorAll("#showList");

const unreadCount = document.getElementById("unreadCount");


function alert(icon, title, message) {
  mdui.alert({
    icon: icon,
    headline: title,
    description: message,
    confirmText: "确定",
    onConfirm: () => console.log("confirmed"),
  });
}

function snackbar(message,closeTime,placement) {
  mdui.snackbar({
    message: message,
    autoCloseDelay: closeTime,
    placement: placement,
  });
}

var exitFullscreen = false;

// 全屏事件
function handleFullScreen() {
  var element = document.documentElement;
  var btnIcon = document.getElementById("btn-fullscreen"); // 获取按钮的引用

  if (document.fullscreenElement) {
    // 当前已全屏，退出全屏
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
    // 当前未全屏，请求全屏
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullScreen) {
      element.webkitRequestFullScreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      // IE11
      element.msRequestFullscreen();
    }
  }
}

window.onresize = function () {
  var isFull = !!document.fullscreenElement; // 使用现代API来检测全屏状态
  if (isFull == false) {
    $("#exitFullScreen").css("display", "none");
    $("#fullScreen").css("display", "");
  } else {
    $("#exitFullScreen").css("display", "");
    $("#fullScreen").css("display", "none");
  }
};

function openErrorDialog() {
  const errorSnackbar = document.querySelector(".errorSnackbar");
  errorSnackbar.open = true;
}

function openBlockDialog() {
  const blockDialog = document.querySelector(".block-dialog");
  const closeButton2 = blockDialog.querySelector(".close-block-dialog");
  blockDialog.open = true;
  closeButton2.addEventListener("click", () => (blockDialog.open = false));
}

function showSettingsSavedSnackbar() {
  const settingSnackbar = document.querySelector(".settingsSnackbar");
  if (settingSnackbar.open) {
    settingSnackbar.open = false;
  }
  settingSnackbar.open = true;
}

function navigate(pageId) {
  var pages = document.querySelectorAll(".page");
  for (var i = 0; i < pages.length; i++) {
    pages[i].style.display = "none";
  }
  document.getElementById(pageId).style.display = "block";
  var navigationItems = document.querySelectorAll("mdui-navigation-rail-item");
  for (var i = 0; i < navigationItems.length; i++) {
    navigationItems[i].removeAttribute("active");
  }
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

function showTime() {
  var date = new Date();
  var month = date.getMonth() + 1;
  month = month < 10 ? "0" + month : month;
  var day = date.getDate();
  day = day < 10 ? "0" + day : day;
  var hour = date.getHours();
  hour = hour < 10 ? "0" + hour : hour;
  var minute = date.getMinutes();
  minute = minute < 10 ? "0" + minute : minute;
  var seconds = date.getSeconds();
  seconds = seconds < 10 ? "0" + seconds : seconds;
  var current =
    month + "-" + day + "&nbsp;&nbsp;" + hour + ":" + minute + ":" + seconds;
  document.getElementById("time").innerHTML = current;

  openAddDialogButton.removeAttribute("loading");
}

let messageInterval;

function loadSettings() {
  const scrollTime = localStorage.getItem(STORAGE_KEYS.SCROLL_TIME);
  if (scrollTime) {
    document.getElementById("msgScrollTime").value = scrollTime;
  }
  const fontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
  if (fontSize) {
    fontSizeSlider.forEach((slider) => {
      slider.value = fontSize;
    });
    initFontSize();
  }
}

function showListContainer() {
  const isHidden =
    listContainer.style.display === "none" ||
    listContainer.style.transform === "translateX(-100%)";
  if (isHidden) {
    // 显示侧边栏
    listContainer.style.display = "block";
    void listContainer.offsetWidth;
    listContainer.style.transform = "translateX(0)";
    listContainer.style.opacity = "1";

    pages.forEach((page) => {
      page.style.transform = "translateX(14rem)";
      page.style.margin = "0rem 0rem 0rem 5rem";
      page.style.width = "calc(100vw - 5rem - 14rem - 5rem - 1rem)";
    });
    listContainerSwitch.innerHTML =
      '<span class="material-icons-round">menu_open</span>';
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
      '<span class="material-icons-round">menu</span>';
    setTimeout(() => {
      listContainer.style.display = "none";
    }, 300);
  }
}

function displayMessages() {
  if (showListElements.length === 0) {
    snackbar("错误：没有找到可以显示的消息内容。",3000,"bottom");
    return;
  }

  showListElements.forEach((el) => {
    el.style.opacity = "1";
    el.style.flexDirection = "row";
  });

  const msgCards = document.querySelectorAll("mdui-card.msgCard");
  const overviewItems = overviewList.querySelectorAll("mdui-list-item");
  const scrollTimeSlider = document.getElementById("msgScrollTime");

  let currentIndex = 0;
  let lastSwitchSecond = -1;

  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }

  if (msgCards.length === 0) {
    showListElements.forEach((el) => {
      el.innerHTML =
        '<span class="material-icons-round" style="font-size: 3.2rem;">notifications_off</span>';
      el.style.opacity = "0.2";
      el.style.flexDirection = "column";
    });
    overviewItems.forEach((item) => item.removeAttribute("active"));
    return;
  }

  const firstMessage =
    msgCards[currentIndex].querySelector("mdui-card-content").textContent;
  showListElements.forEach((el) => (el.textContent = firstMessage));
  overviewItems.forEach((item) => {
    item.removeAttribute("active");
    item.style.opacity = "0.2";
  });
  if (overviewItems[currentIndex]) {
    overviewItems[currentIndex].setAttribute("active", "");
    overviewItems[currentIndex].style.opacity = "1";
  }
  currentIndex = (currentIndex + 1) % msgCards.length;
  lastSwitchSecond = new Date().getSeconds();

  const initialScrollTime = parseInt(scrollTimeSlider.value);
  localStorage.setItem(STORAGE_KEYS.SCROLL_TIME, initialScrollTime);

  scrollTimeSlider.addEventListener("input", () => {
    const newScrollTime = parseInt(scrollTimeSlider.value);
    localStorage.setItem(STORAGE_KEYS.SCROLL_TIME, newScrollTime);
    lastSwitchSecond = new Date().getSeconds();
  });

  messageInterval = setInterval(() => {
    const now = new Date();
    const currentSecond = now.getSeconds();
    const scrollTime = parseInt(scrollTimeSlider.value);
    const secondDiff = (currentSecond - lastSwitchSecond + 60) % 60;

    if (secondDiff >= scrollTime) {
      const messageText =
        msgCards[currentIndex].querySelector("mdui-card-content").textContent;
      showListElements.forEach((el) => {
        el.textContent = messageText;
      });

      overviewItems.forEach((item) => {
        item.removeAttribute("active");
        item.style.opacity = "0.2";
      });
      if (overviewItems[currentIndex]) {
        overviewItems[currentIndex].setAttribute("active", "");
        overviewItems[currentIndex].style.opacity = "1";
      }

      currentIndex = (currentIndex + 1) % msgCards.length;
      lastSwitchSecond = currentSecond;
    }
  }, 100);
}

addButton.addEventListener("click", function () {
  const inputValue = textField.value;
  if (inputValue.trim() !== "") {
    const newCard = document.createElement("mdui-card");
    newCard.className = "msgCard";
    newCard.style.marginBottom = "0.5rem";
    newCard.style.width = "100%";
    newCard.style.padding = "1rem";
    // newCard.clickable = true;
    newCard.variant = "outlined";
    newCard.style.border =
      "0.15rem solid rgba(var(--mdui-color-secondary),0.2)";
    newCard.style.backgroundColor = "rgba(var(--mdui-color-surface-container),0.2)";

    const cardContent = document.createElement("mdui-card-content");
    cardContent.style.whiteSpace = "pre-wrap";
    cardContent.style.overflowWrap = "break-word";
    const textNode = document.createTextNode(inputValue);
    cardContent.appendChild(textNode);
    newCard.appendChild(cardContent);
    msgList.appendChild(newCard);

    const currentFontSize = fontSizeSlider[0].value + "rem";
    newCard.style.fontSize = currentFontSize;

    const overviewMaxLength = 12;
    let displayText = inputValue;
    if (inputValue.length > overviewMaxLength) {
      displayText = inputValue.substring(0, overviewMaxLength) + "...";
    }

    // 在侧边栏的通知列表添加对应通知
    const overviewCard = document.createElement("mdui-list-item");
    overviewCard.description = displayText;
    overviewCard.style.margin = "0.5rem 0 0 0";
    overviewCard.style.padding = "0 0.25rem";
    overviewCard.style.opacity = "0.2";
    overviewCard.style.borderRadius = 'var(--mdui-shape-corner-large)';
    overviewList.appendChild(overviewCard);

    const cardCount = msgList.querySelectorAll("mdui-card").length;
    unreadCount.textContent = cardCount;
    const countDisplay = document.getElementById("count-display");
    countDisplay.textContent = cardCount + " 条通知在队列中";

    textField.value = "";
    displayMessages();

    snackbar("已添加新通知。",1000,"bottom");
    
    openAddDialogButton.removeAttribute("extended");
  }
});

function initFontSize() {
  const currentFontSize = fontSizeSlider[0].value + "rem";
  const msgCards = document.querySelectorAll("mdui-card.msgCard");
  const viewCard = document.querySelector("mdui-card.viewCard");
  const showListElements = document.querySelectorAll("#showList");

  msgCards.forEach((card) => {
    card.style.fontSize = currentFontSize;
  });
  if (viewCard) {
    viewCard.style.fontSize = currentFontSize;
  }
  showListElements.forEach((el) => {
    el.style.fontSize = currentFontSize;
  });
}

fontSizeSlider.forEach((slider) => {
  slider.addEventListener("input", function () {
    let fontSizeValue = this.value + "rem";
    const currentValue = this.value;
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, currentValue);
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
  });
});
window.onload = function () {
  setInterval(showTime, 1000);
  loadSettings();
  initFontSize();
  displayMessages();
};
