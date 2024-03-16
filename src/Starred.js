import { getStarredEntries } from "./apis";
import Content from "./components/Content";
import { ContentProvider } from "./components/ContentContext";

export default function Starred() {
  return (
    <ContentProvider>
      <Content
        info={{ from: "starred", id: "" }}
        getEntries={getStarredEntries}
      />
    </ContentProvider>
  );
}
