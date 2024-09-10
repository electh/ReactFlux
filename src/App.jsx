import { Layout } from "@arco-design/web-react";
import { SWRConfig } from "swr";
import "./App.css";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";
import { useScreenWidth } from "./hooks/useScreenWidth";
import useTheme from "./hooks/useTheme";

const App = () => {
  useTheme();
  const { isBelowLarge } = useScreenWidth();

  return (
    <SWRConfig
      value={{
        refreshInterval: 0,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }}
    >
      <div className="app">
        {isBelowLarge ? null : (
          <Layout.Sider
            breakpoint="lg"
            className="sidebar"
            collapsible={false}
            trigger={null}
            width={240}
          >
            <Sidebar />
          </Layout.Sider>
        )}
        <Header />
        <Main />
      </div>
    </SWRConfig>
  );
};

export default App;
