import { Layout } from "@arco-design/web-react";
import "./App.css";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";
import { useScreenWidth } from "./hooks/useScreenWidth";
import useTheme from "./hooks/useTheme";

const App = () => {
  useTheme();
  const { belowLg } = useScreenWidth();

  return (
    <div className="app">
      {belowLg ? null : (
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
  );
};

export default App;
