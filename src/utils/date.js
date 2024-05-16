import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { getConfig } from "./config";

dayjs.extend(duration);
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
  const showDetailed = getConfig("showDetailedRelativeTime");
  if (!showDetailed) {
    const relativeTime = dayjs(dateString).fromNow();
    return relativeTime === "a few seconds ago" ? "just now" : relativeTime;
  }

  const now = dayjs();
  const target = dayjs(dateString);
  const diff = target.diff(now);
  const diffDuration = dayjs.duration(Math.abs(diff));

  const years = diffDuration.years();
  const months = diffDuration.months();
  const days = diffDuration.days();
  const hours = diffDuration.hours();
  const minutes = diffDuration.minutes();

  const timeUnits = [];
  if (years > 0) {
    timeUnits.push(`${years} year${years > 1 ? "s" : ""}`);
  }
  if (months > 0) {
    timeUnits.push(`${months} month${months > 1 ? "s" : ""}`);
  }
  if (days > 0) {
    timeUnits.push(`${days} day${days > 1 ? "s" : ""}`);
  }
  if (hours > 0) {
    timeUnits.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  }
  if (minutes > 0) {
    timeUnits.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  }

  if (timeUnits.length === 0) {
    return "just now";
  }

  const relativeTime = timeUnits.join(" ");
  return diff > 0 ? `in ${relativeTime}` : `${relativeTime} ago`;
};

export const getUTCDate = () => {
  return dayjs().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
};
