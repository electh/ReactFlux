import { useStore } from "./Store";
import { thunder } from "./apis/axios";
import Content from "./components/Content";
import { ContentProvider } from "./components/ContentContext";
import { get24HoursAgoUnixTimestamp } from "./utils/Date";

export default function Today() {
  const { unreadToday, setUnreadToday } = useStore();

  const getEntries = async (offset = 0, status = null) => {
    const timestamp = get24HoursAgoUnixTimestamp();
    const base_url = `/v1/entries?order=published_at&direction=desc&published_after=${timestamp}&offset=${offset}`;
    const url = status ? `${base_url}&status=${status}` : base_url;

    const response = await thunder.request({ method: "get", url });
    if (status && !unreadToday) {
      setUnreadToday(response.data.total);
    }
    return response;
  };

  return (
    <ContentProvider>
      <Content info={{ from: "today", id: "" }} getEntries={getEntries} />
    </ContentProvider>
  );
}
