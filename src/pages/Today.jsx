import { getTodayEntries, updateEntriesStatus } from "../apis";
import Content from "../components/Content/Content";

const Today = () => {
  const markTodayAsRead = async () => {
    const initialResponse = await getTodayEntries(0, "unread");
    let unreadEntryIds = initialResponse.data.entries.map((entry) => entry.id);

    const totalUnread = initialResponse.data.total;
    if (totalUnread > unreadEntryIds.length) {
      const remainingUnread = totalUnread - unreadEntryIds.length;
      const additionalEntries = await getTodayEntries(
        unreadEntryIds.length,
        "unread",
        Math.ceil(remainingUnread / 100) * 100,
      );

      unreadEntryIds = [
        ...unreadEntryIds,
        ...additionalEntries.data.entries.map((entry) => entry.id),
      ];
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
