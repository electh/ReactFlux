import { useAtomValue } from "jotai";
import { getTodayEntries, updateEntriesStatus } from "../apis";
import { unreadTodayCountAtom } from "../atoms/dataAtom";
import Content from "../components/Content/Content";

const Today = () => {
  const unreadTodayCount = useAtomValue(unreadTodayCountAtom);

  const markTodayAsRead = async () => {
    let unreadEntries = getTodayEntries("unread").then(
      (response) => response.data.entries,
    );

    if (unreadTodayCount > unreadEntries.length) {
      unreadEntries = getTodayEntries("unread", null, unreadTodayCount).then(
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
