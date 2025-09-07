// 获取DOM元素
const toggleButton = document.getElementById("open-nodisturb");
const screenSaver = document.getElementById("no-disturb-screen");
const exitButton = document.getElementById("exit-screensaver");
const timeDisplay = document.getElementById("time-display");
const countDisplay = document.getElementById("count-display");

// 切换息屏显示状态
toggleButton.addEventListener("click", toggleScreenSaver);
exitButton.addEventListener("click", toggleScreenSaver);

function toggleScreenSaver() {
  if (screenSaver.style.display === "flex") {
    // 关闭息屏显示
    screenSaver.classList.remove("active");
    handleFullScreen();
    setTimeout(() => {
      screenSaver.style.display = "none";
    }, 800);
  } else {
    // 开启息屏显示
    screenSaver.style.display = "flex";
    void screenSaver.offsetWidth;
    screenSaver.classList.add("active");
    setInterval(updateDateTime, 100);
    handleFullScreen();

    setTimeout(() => {
      snackbar("<b>息屏显示已启用</b><br><small>点击屏幕正下方按钮退出退出到正常窗口。</small>", 5000, "bottom-end")
    }, 500)
  }
}

function updateDateTime() {
  const now = new Date();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  timeDisplay.textContent = `${hours}:${minutes}`;
}
