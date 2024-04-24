import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const checkIsInLast24Hours = (dateString) => {
  const targetDate = dayjs(dateString);
  return targetDate.isAfter(dayjs().subtract(24, "hour"));
};

export const get24HoursAgoTimestamp = () => {
  return dayjs().subtract(24, "hour").unix();
};

export const generateRelativeTime = (dateString) => {
  const relativeTime = dayjs(dateString).fromNow();
  return relativeTime === "a few seconds ago" ? "just now" : relativeTime;
};

export const getUTCDate = () => {
  return dayjs().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
};
