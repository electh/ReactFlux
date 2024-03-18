import dayjs from "dayjs";

export function formatDate(date) {
  // 获取当前日期
  const today = dayjs();

  // 判断是否为同一天
  if (today.isSame(dayjs(date), "day")) {
    // 如果是同一天，显示时间
    return dayjs(date).format("HH:mm");
  } else {
    // 否则显示日期
    return dayjs(date).format("YYYY-MM-DD");
  }
}
