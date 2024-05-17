import { useAtomValue } from "jotai";
import { getTodayEntries, updateEntriesStatus } from "../apis";
import { unreadTodayCountAtom } from "../atoms/dataAtom";
import Content from "../components/Content/Content";

const Today = () => {
  const unreadTodayCount = useAtomValue(unreadTodayCountAtom);

  const markTodayAsRead = async () => {
    const unreadEntries = getTodayEntries(0, "unread", unreadTodayCount).then(
      (response) => response.data.entries,
    );
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
