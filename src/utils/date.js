import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { polyglotState } from "../hooks/useLanguage";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);

export const checkIsInLast24Hours = (dateString) => {
  const targetDate = dayjs(dateString);
  return targetDate.isAfter(dayjs().subtract(24, "hour"));
};

export const get24HoursAgoTimestamp = () => dayjs().subtract(24, "hour").unix();

export const getTimestamp = (dateString) => dayjs(dateString).unix();

export const getStartOfToday = () => dayjs().startOf("day");

export const getDayEndTimestamp = (dateString) =>
  dayjs(dateString).endOf("day").unix();

export const getUTCDate = () =>
  dayjs().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");

export const generateReadableDate = (dateString) =>
  dayjs(dateString).format("dddd, MMMM D, YYYY h:mm A");

export const generateRelativeTime = (dateString, showDetailed) => {
  const { polyglot } = polyglotState.get();

  if (!showDetailed) {
    const now = dayjs();
    const target = dayjs(dateString);
    const relativeTime = target.from(now);
    const diffInSeconds = dayjs.duration(now.diff(target)).asSeconds();
    if (diffInSeconds >= 0 && diffInSeconds < 60) {
      return polyglot.t("date.just_now");
    }
    return relativeTime;
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
    timeUnits.push(polyglot.t("date.years", years));
  }
  if (months > 0) {
    timeUnits.push(polyglot.t("date.months", months));
  }
  if (days > 0) {
    timeUnits.push(polyglot.t("date.days", days));
  }
  if (hours > 0) {
    timeUnits.push(polyglot.t("date.hours", hours));
  }
  if (minutes > 0) {
    timeUnits.push(polyglot.t("date.minutes", minutes));
  }

  if (timeUnits.length === 0) {
    return polyglot.t("date.just_now");
  }

  const relativeTime = timeUnits.join(" ");
  return diff > 0
    ? polyglot.t("date.in_time", { time: relativeTime })
    : polyglot.t("date.time_ago", { time: relativeTime });
};

export const generateReadingTime = (time) => {
  const { polyglot } = polyglotState.get();

  const minuteStr = polyglot.t("date.minutes", time);
  return polyglot.t("article_card.reading_time", { time: minuteStr });
};
