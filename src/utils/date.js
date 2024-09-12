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

export const get24HoursAgoTimestamp = () => {
  return dayjs().subtract(24, "hour").unix();
};

export const getUTCDate = () => {
  return dayjs().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
};

export const generateReadableDate = (dateString) => {
  return dayjs(dateString).format("dddd, MMMM D, YYYY h:mm A");
};

export const generateRelativeTime = (dateString, showDetailed) => {
  const { polyglot } = polyglotState.get();

  if (!showDetailed) {
    const now = dayjs();
    const target = dayjs(dateString);
    const relativeTime = target.from(now);
    const diffInSeconds = target.diff(now, "second");
    if (diffInSeconds < 60) {
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
    timeUnits.push(
      polyglot.t(years > 1 ? "date.years" : "date.year", { count: years }),
    );
  }
  if (months > 0) {
    timeUnits.push(
      polyglot.t(months > 1 ? "date.months" : "date.month", { count: months }),
    );
  }
  if (days > 0) {
    timeUnits.push(
      polyglot.t(days > 1 ? "date.days" : "date.day", { count: days }),
    );
  }
  if (hours > 0) {
    timeUnits.push(
      polyglot.t(hours > 1 ? "date.hours" : "date.hour", { count: hours }),
    );
  }
  if (minutes > 0) {
    timeUnits.push(
      polyglot.t(minutes > 1 ? "date.minutes" : "date.minute", {
        count: minutes,
      }),
    );
  }

  if (timeUnits.length === 0) {
    return polyglot.t("date.just_now");
  }

  const relativeTime = timeUnits.join(" ");
  return diff > 0
    ? polyglot.t("date.in_time", { time: relativeTime })
    : polyglot.t("date.time_ago", { time: relativeTime });
};
