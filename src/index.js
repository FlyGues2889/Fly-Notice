const STORAGE_KEYS = {
  SCROLL_TIME: "scrollTime",
  FONT_SIZE: "fontSize",
};

function openDialog1() {
  const dialog1 = document.querySelector(".example-action");
  const closeButton1 = dialog1.querySelector("mdui-button");
  dialog1.open = true;
  closeButton1.addEventListener("click", () => (dialog1.open = false));
}

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
}

const pages = document.querySelectorAll(".page");
const textField = document.getElementById("excludeNums");
const addButton = document.querySelector(".add-button");
const msgList = document.querySelector(".msgList");
const unreadCount = document.getElementById("unreadCount");
const fontSizeSlider = document.querySelectorAll(".msgFontSize");
const showList = document.getElementById("showList");
const overviewList = document.querySelector(".overviewList");
const listContainer = document.querySelector(".list-container");
const listContainerSwitch = document.getElementById("list-container-switch");

let messageInterval;

function loadSettings() {
  // 移除SIDEBAR_VISIBLE相关加载逻辑
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
    listContainer.style.display = "block";
    void listContainer.offsetWidth;
    listContainer.style.transform = "translateX(0)";
    listContainer.style.opacity = "1";
    pages.forEach((page) => {
      page.style.transform = "translateX(14rem)";
      page.style.margin = "3rem 0rem 0rem 5rem";
      page.style.width = "calc(100vw - 5rem - 14rem - 5rem)";
    });
    listContainerSwitch.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M11.5 14.8V9.2q0-.35-.3-.475t-.55.125L8.2 11.3q-.3.3-.3.7t.3.7l2.45 2.45q.25.25.55.125t.3-.475M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm9-2V5H5v14z"/></svg>';
    // 移除SIDEBAR_VISIBLE存储逻辑
  } else {
    listContainer.style.transform = "translateX(-100%)";
    listContainer.style.opacity = "0";
    pages.forEach((page) => {
      page.style.transform = "translateX(0)";
      page.style.margin = "3rem 0rem 0rem 5rem";
      page.style.width = "calc(100vw - 5rem)";
    });
    listContainerSwitch.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 9.2v5.6q0 .35.3.475t.55-.125l2.45-2.45q.3-.3.3-.7t-.3-.7l-2.45-2.45q-.25-.25-.55-.125t-.3.475M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm5-2h9V5h-9z" /></svg>';
    // 移除SIDEBAR_VISIBLE存储逻辑
    setTimeout(() => {
      listContainer.style.display = "none";
    }, 300);
  }
}

function displayMessages() {
  showList.style.opacity = "1";
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
    showList.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="52" viewBox="0 0 24 24"><path fill="currentColor" d="M16.15 19H5q-.425 0-.712-.288T4 18t.288-.712T5 17h1v-7q0-.825.213-1.625T6.85 6.85l1.5 1.5q-.175.4-.262.813T8 10v7h6.2L2.1 4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l17 17q.275.275.288.688t-.288.712q-.275.275-.7.275t-.7-.275zM13.5 4.2q2 .5 3.25 2.112T18 10v2.75q0 .5-.312.75t-.688.25t-.687-.262t-.313-.763V10q0-1.65-1.175-2.825T12 6q-.4 0-.85.1t-.8.25q-.425.175-.837.075t-.638-.475q-.2-.325-.137-.687t.387-.538t.675-.3t.7-.225v-.7q0-.625.438-1.062T12 2t1.063.438T13.5 3.5zM12 22q-.75 0-1.338-.413t-.587-1.112q0-.2.163-.337T10.6 20h2.8q.2 0 .363.138t.162.337q0 .7-.587 1.113T12 22m.825-12.025"/></svg>';
    showList.style.opacity = "0.2";
    overviewItems.forEach((item) => item.removeAttribute("active"));
    return;
  }

  const firstMessage =
    msgCards[currentIndex].querySelector("mdui-card-content").textContent;
  showList.textContent = firstMessage;
  overviewItems.forEach((item) => item.removeAttribute("active"));
  if (overviewItems[currentIndex])
    overviewItems[currentIndex].setAttribute("active", "");

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
      showList.textContent = messageText;

      overviewItems.forEach((item) => item.removeAttribute("active"));
      if (overviewItems[currentIndex])
        overviewItems[currentIndex].setAttribute("active", "");

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
    newCard.clickable = true;

    const cardContent = document.createElement("mdui-card-content");
    cardContent.style.whiteSpace = "pre-wrap";
    cardContent.style.overflowWrap = "break-word";
    const textNode = document.createTextNode(inputValue);
    cardContent.appendChild(textNode);
    newCard.appendChild(cardContent);
    msgList.appendChild(newCard);

    const currentFontSize = fontSizeSlider[0].value + "rem";
    newCard.style.fontSize = currentFontSize;

    const overviewMaxLength = 18;
    let displayText = inputValue;
    if (inputValue.length > overviewMaxLength) {
      displayText = inputValue.substring(0, overviewMaxLength) + "...";
    }

    const overviewCard = document.createElement("mdui-list-item");
    overviewCard.rounded = true;
    overviewCard.description = displayText;
    overviewCard.style.margin = "1rem 0";
    overviewCard.style.padding = "0.25rem 0";
    overviewList.appendChild(overviewCard);

    const cardCount = msgList.querySelectorAll("mdui-card").length;
    unreadCount.textContent = cardCount;

    textField.value = "";
    displayMessages();
  }
});

function initFontSize() {
  const currentFontSize = fontSizeSlider[0].value + "rem";
  const msgCards = document.querySelectorAll("mdui-card.msgCard");
  const viewCard = document.querySelector("mdui-card.viewCard");
  const showList = document.querySelector("div.showList");

  msgCards.forEach((card) => {
    card.style.fontSize = currentFontSize;
  });
  if (viewCard) {
    viewCard.style.fontSize = currentFontSize;
  }
  if (showList) {
    showList.style.fontSize = currentFontSize;
  }
}

fontSizeSlider.forEach((slider) => {
  slider.addEventListener("input", function () {
    let fontSizeValue = this.value + "rem";
    const currentValue = this.value;
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, currentValue);
    const msgCards = document.querySelectorAll("mdui-card.msgCard");
    const viewCard = document.querySelector("mdui-card.viewCard");
    const showList = document.querySelector("div.showList");

    msgCards.forEach((card) => {
      card.style.fontSize = fontSizeValue;
    });
    if (viewCard) {
      viewCard.style.fontSize = fontSizeValue;
    }
    if (showList) {
      showList.style.fontSize = fontSizeValue;
    }
  });
});

window.onload = function () {
  setInterval(showTime, 1000);
  loadSettings();
  initFontSize();
  displayMessages();
};
