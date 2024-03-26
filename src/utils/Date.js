import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const checkIsInLast24Hours = (dateStr) => {
  const givenDate = dayjs(dateStr);
  const now = dayjs();
  return givenDate.isAfter(now.subtract(24, "hour"));
};

const get24HoursAgoTimestamp = () => {
  const now = dayjs();
  const twentyFourHoursAgo = now.subtract(24, "hour");
  return twentyFourHoursAgo.unix();
};

const generateRelativeTime = (dateStr) => {
  return dayjs(dateStr).fromNow();
};

export { checkIsInLast24Hours, get24HoursAgoTimestamp, generateRelativeTime };
