import { getAllEntries, markAllAsRead } from "../apis";
import Content from "../components/Content/Content";

const All = () => (
  <Content
    info={{ from: "all", id: "" }}
    getEntries={getAllEntries}
    markAllAsRead={markAllAsRead}
  />
);

export default All;
