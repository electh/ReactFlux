import { getTodayEntries, updateEntriesStatus } from "../apis";
import Content from "../components/Content/Content";

const Today = () => {
  const markTodayAsRead = async () => {
    const response = await getTodayEntries(0, "unread");
    const unreadEntryIds = response.data.entries.map((entry) => entry.id);

    if (response.data.total > unreadEntryIds.length) {
      const remaining = response.data.total - unreadEntryIds.length;
      const batchSize = Math.ceil(remaining / 100) * 100;
      const additionalResponse = await getTodayEntries(
        unreadEntryIds.length,
        "unread",
        batchSize,
      );
      unreadEntryIds.push(
        ...additionalResponse.data.entries.map((entry) => entry.id),
      );
    }
    return updateEntriesStatus(unreadEntryIds, "read");
  };

  return (
    <Content
      info={{ from: "today", id: "" }}
      getEntries={getTodayEntries}
      markAllAsRead={markTodayAsRead}
    />
  );
};

export default Today;
