import { getCurrentUser } from "./apis";
import { thunder } from "./apis/axios";
import Content from "./components/Content";
import { ContentProvider } from "./components/ContentContext";

export default function All() {
  const getEntries = async (offset = 0, status = null) => {
    const base_url = `/v1/entries?order=published_at&direction=desc&offset=${offset}`;
    const url = status ? `${base_url}&status=${status}` : base_url;

    return await thunder.request({ method: "get", url });
  };

  const markAllAsRead = async () => {
    const currentUser = await getCurrentUser();
    return await thunder.request({
      method: "put",
      url: `/v1/users/${currentUser.data.id}/mark-all-as-read`,
    });
  };

  return (
    <ContentProvider>
      <Content
        info={{ from: "all", id: "" }}
        getEntries={getEntries}
        markAllAsRead={markAllAsRead}
      />
    </ContentProvider>
  );
}
