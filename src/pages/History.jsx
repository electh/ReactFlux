import React from "react";
import { getHistoryEntries } from "../apis";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";

const History = () => (
  <ContentProvider>
    <Content
      info={{ from: "history", id: "" }}
      getEntries={getHistoryEntries}
    />
  </ContentProvider>
);

export default History;
