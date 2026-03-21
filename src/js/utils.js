export const generateUniqueId = () =>
  `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

export const showTime = () => {
  const date = new Date();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const current = `${hour} : ${minute} : ${seconds}`;
  const timeElement = document.getElementById("time");
  if (timeElement) {
    timeElement.innerHTML = current;
  }
};

export const alert = (icon, title, message) => {
  mdui.alert({
    icon: icon,
    headline: title,
    description: message,
    confirmText: "确定",
    onConfirm: () => console.log("confirmed"),
  });
};

export const snackbar = (message, closeTime, placement) => {
  mdui.snackbar({
    message: message,
    autoCloseDelay: closeTime,
    placement: placement,
  });
};