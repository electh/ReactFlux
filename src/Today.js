import { getTodayEntries } from "./apis";
import Content from "./components/Content";
import { ContentProvider } from "./components/ContentContext";

export default function Today() {
  return (
    <ContentProvider>
      <Content info={{ from: "today", id: "" }} getEntries={getTodayEntries} />
    </ContentProvider>
  );
}
