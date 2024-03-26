import React from "react";
import { getStarredEntries } from "../apis";
import Content from "../components/Content/Content";
import { ContentProvider } from "../components/Content/ContentContext";

const Starred = () => (
  <ContentProvider>
    <Content
      info={{ from: "starred", id: "" }}
      getEntries={getStarredEntries}
    />
  </ContentProvider>
);

export default Starred;
