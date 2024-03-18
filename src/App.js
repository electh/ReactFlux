import { Avatar, Layout } from "@arco-design/web-react";
import { useStore } from "./Store";
import Sidebar from "./layout/Sidebar";
import "./App.css";
import Toolbar from "./layout/Toolbar";
import Content from "./layout/Content";
import { useEffect } from "react";
import { IconBook } from "@arco-design/web-react/icon";

const Sider = Layout.Sider;
const Header = Layout.Header;
export default function App() {
  const collapsed = useStore((state) => state.collapsed);
  const setCollapsed = useStore((state) => state.setCollapsed);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const setIsDarkMode = useStore((state) => state.setIsDarkMode);

  window.matchMedia("(prefers-color-scheme: dark)").addListener((e) => {
    setIsDarkMode(e.matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
    }
  }, [isDarkMode]);

  return (
    <Layout className="layout-collapse-demo">
      <Sider
        breakpoint="lg"
        onCollapse={setCollapsed}
        collapsed={collapsed}
        width={220}
        collapsible
        trigger={null}
        style={{ zIndex: 999, borderRight: "1px solid var(--color-border-2)" }}
      >
        <div
          className="logo"
          style={{
            display: "flex",
            alignItems: "center",
            margin: collapsed ? "8px" : "8px 12px",
            transition: "all 0.1s linear",
          }}
        >
          <Avatar
            size={32}
            style={{
              backgroundColor: "var(--color-text-1)",
            }}
          >
            <IconBook style={{ color: "var(--color-bg-1)" }} />
          </Avatar>
        </div>
        <Sidebar style={{ width: "100%" }} />
      </Sider>
      <Layout>
        <Header style={{ borderBottom: "1px solid var(--color-border-2)" }}>
          <Toolbar />
        </Header>
        <Content />
      </Layout>
    </Layout>
  );
}
