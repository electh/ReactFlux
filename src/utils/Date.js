import dayjs from "dayjs";

export const isInLast24Hours = (dateStr) => {
  const givenDate = dayjs(dateStr);
  const now = dayjs();
  return givenDate.isAfter(now.subtract(24, "hour"));
};

export const get24HoursAgoUnixTimestamp = () => {
  const now = dayjs();
  const twentyFourHoursAgo = now.subtract(24, "hour");
  return twentyFourHoursAgo.unix();
};
