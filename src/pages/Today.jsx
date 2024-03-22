import useStore from "../Store";
import { getTodayEntries } from "../apis";
import { updateEntriesStatus } from "../apis";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";

const Today = () => {
  const unreadToday = useStore((state) => state.unreadToday);
  const limit = Math.ceil(unreadToday / 100) * 100;
  const markTodayAsRead = async () => {
    const unreadEntryIds = [];
    const response = await getTodayEntries(0, "unread", limit);
    unreadEntryIds.push(...response.data.entries.map((entry) => entry.id));
    return updateEntriesStatus(unreadEntryIds, "read");
  };

  return (
    <ContentProvider>
      <Content
        info={{ from: "today", id: "" }}
        getEntries={getTodayEntries}
        markAllAsRead={markTodayAsRead}
      />
    </ContentProvider>
  );
};

export default Today;
