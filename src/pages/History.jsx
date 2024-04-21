import { getHistoryEntries } from "../apis";
import Content from "../components/Content/Content";

const History = () => (
  <Content info={{ from: "history", id: "" }} getEntries={getHistoryEntries} />
);

export default History;
