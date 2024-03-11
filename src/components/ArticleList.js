import AddFeedModal from "./AddFeedModal";
import SettingsModal from "./SettingsModal";
import { Outlet } from "react-router-dom";
import { useStore } from "../Store";

export default function ArticleList() {
  const { collapsed } = useStore();

  return (
    <div
      className="article-list"
      style={{
        backgroundColor: "var(--color-fill-1)",
        paddingTop: "49px",
        paddingLeft: collapsed ? "48px" : "200px",
        height: "calc(100vh - 49px)",
        display: "flex",
        transition: "all 0.1s linear",
        width: collapsed ? "calc(100% - 49px)" : "calc(100% - 200px)",
      }}
    >
      <Outlet />
      <SettingsModal />
      <AddFeedModal />
    </div>
  );
}
