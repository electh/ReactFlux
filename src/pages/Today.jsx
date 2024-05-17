import { getTodayEntries, updateEntriesStatus } from "../apis";
import Content from "../components/Content/Content";

const Today = () => {
  const markTodayAsRead = async () => {
    const unreadTodayResponse = await getTodayEntries(0, "unread");
    const unreadTodayCount = unreadTodayResponse.data.total;
    let unreadEntries = unreadTodayResponse.data.entries;

    if (unreadTodayCount > unreadEntries.length) {
      unreadEntries = getTodayEntries(0, "unread", unreadTodayCount).then(
        (response) => response.data.entries,
      );
    }

    const unreadEntryIds = unreadEntries.map((entry) => entry.id);
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
