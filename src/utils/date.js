import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const checkIsInLast24Hours = (dateStr) => {
  const givenDate = dayjs(dateStr);
  const now = dayjs();
  return givenDate.isAfter(now.subtract(24, "hour"));
};

export const get24HoursAgoTimestamp = () => {
  const now = dayjs();
  const twentyFourHoursAgo = now.subtract(24, "hour");
  return twentyFourHoursAgo.unix();
};

export const generateRelativeTime = (dateStr) => {
  const result = dayjs(dateStr).fromNow();
  return result === "a few seconds ago" ? "just now" : result;
};

export const getUTCDate = () => {
  return dayjs().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSSZ");
};
