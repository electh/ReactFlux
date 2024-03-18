import { generate, getRgbStr } from "@arco-design/color";

import { getConfig } from "./Config";

const colors = [
  {
    name: "Red",
    valueLight: "#F53F3F",
    valueDark: "#F76965",
  },
  {
    name: "Orange",
    valueLight: "#F77234",
    valueDark: "#F9925A",
  },
  {
    name: "Green",
    valueLight: "#00B42A",
    valueDark: "#27C346",
  },
  {
    name: "Blue",
    valueLight: "#165DFF",
    valueDark: "#3C7EFF",
  },
  {
    name: "Purple",
    valueLight: "#722ED1",
    valueDark: "#8E51DA",
  },
];

const getColorValue = (colorName) => {
  // 查找匹配颜色名称的对象
  const selectedColor = colors.find((color) => color.name === colorName);
  const theme = getConfig("theme") || "light";
  if (selectedColor) {
    return theme === "light"
      ? selectedColor.valueLight
      : selectedColor.valueDark;
  }
  return "#165DFF";
};

const applyColor = (colorName) => {
  const list = generate(getColorValue(colorName), {
    list: true,
  }).map((x) => getRgbStr(x));
  list.forEach((x, i) => {
    document.body.style.setProperty(`--primary-${i + 1}`, x);
  });
};

export { colors, getColorValue, applyColor };
