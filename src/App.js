import { Avatar, Layout } from "@arco-design/web-react";
import { useStore } from "./store/Store";
import Sidebar from "./layout/Sidebar";
import "./App.css";
import Toolbar from "./layout/Toolbar";
import Content from "./layout/Content";
import { useEffect } from "react";
import { IconBook } from "@arco-design/web-react/icon";
import { useConfigStore } from "./store/configStore";
import { applyColor } from "./utils/colors";

const Sider = Layout.Sider;
const Header = Layout.Header;
export default function App() {
  const collapsed = useStore((state) => state.collapsed);
  const setCollapsed = useStore((state) => state.setCollapsed);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const setIsDarkMode = useStore((state) => state.setIsDarkMode);
  const color = useConfigStore((state) => state.color);
  const setIsMobile = useStore((state) => state.setIsMobile);
  const isMobile = useStore((state) => state.isMobile);
  const initData = useStore((state) => state.initData);

  useEffect(() => {
    async function fetchData() {
      await initData();
    }

    fetchData();
    document.body.addEventListener(
      "touchmove",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
      },
      { passive: false },
    );

    return () => {
      document.body.removeEventListener(
        "touchmove",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
        },
        { passive: false },
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 700);
    };

    const handelDarkMode = (event) => {
      setIsDarkMode(event.matches);
    };

    // 添加窗口大小变化监听器
    window.addEventListener("resize", handleResize);

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (event) => {
        handelDarkMode(event);
      });

    // 在组件卸载时清除监听器
    return () => {
      window.removeEventListener("resize", handleResize);
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", (event) => {
          handelDarkMode(event);
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute("arco-theme", "dark");
      document.body.style.colorScheme = "dark";
    } else {
      document.body.removeAttribute("arco-theme");
      document.body.style.colorScheme = "light";
    }
  }, [isDarkMode]);

  useEffect(() => {
    applyColor(color);
  }, [color]);

  return (
    <Layout className="layout-collapse-demo">
      <Sider
        breakpoint="lg"
        className="sider-normal"
        onCollapse={setCollapsed}
        collapsed={collapsed}
        width={220}
        collapsible
        trigger={null}
        style={{
          zIndex: 999,
          borderRight: "1px solid var(--color-border-2)",
          display: isMobile ? "none" : "block",
        }}
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
