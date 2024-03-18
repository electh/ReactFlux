import { getTodayEntries } from "../apis";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";

const Today = () => (
  <ContentProvider>
    <Content info={{ from: "today", id: "" }} getEntries={getTodayEntries} />
  </ContentProvider>
);

export default Today;
