import { getAllEntries, getCurrentUser } from "../apis";
import { apiClient } from "../apis/axios";
import Content from "../components/Content/Content";

const All = () => {
  const markAllAsRead = async () => {
    const currentUser = await getCurrentUser();
    return apiClient.put(`/v1/users/${currentUser.data.id}/mark-all-as-read`);
  };

  return (
    <Content
      info={{ from: "all", id: "" }}
      getEntries={getAllEntries}
      markAllAsRead={markAllAsRead}
    />
  );
};

export default All;
