import dayjs from "dayjs";

export const isIn24Hours = (dateStr) => {
  const givenDate = dayjs(dateStr);
  const now = dayjs();
  return givenDate.isBefore(now.add(24, "hour")) && givenDate.isAfter(now);
};

export const get24HoursAgoUnixTimestamp = () => {
  const now = dayjs();
  const twentyFourHoursAgo = now.subtract(24, "hour");
  return twentyFourHoursAgo.unix();
};
