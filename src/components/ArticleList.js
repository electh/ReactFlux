import { Outlet } from "react-router-dom";

import AddFeedModal from "./AddFeedModal";
import SettingsModal from "./Settings/SettingsModal";

export default function ArticleList() {
  return (
    <div
      className="article-list"
      style={{
        backgroundColor: "var(--color-fill-1)",
        paddingTop: "49px",
        paddingLeft: "200px",
        height: "calc(100vh - 49px)",
        display: "flex",
        transition: "padding-left 0.1s linear, width 0.1s linear",
        width: "calc(100% - 200px)",
      }}
    >
      <Outlet />
      <SettingsModal />
      <AddFeedModal />
    </div>
  );
}
