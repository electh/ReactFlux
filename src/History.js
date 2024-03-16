import { getHistoryEntries } from "./apis";
import Content from "./components/Content";
import { ContentProvider } from "./components/ContentContext";

export default function History() {
  return (
    <ContentProvider>
      <Content
        info={{ from: "history", id: "" }}
        getEntries={getHistoryEntries}
      />
    </ContentProvider>
  );
}
