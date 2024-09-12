import { Layout } from "@arco-design/web-react";
import { useStore } from "@nanostores/react";
import "./App.css";
import Header from "./components/Header/Header";
import Main from "./components/Main/Main";
import Sidebar from "./components/Sidebar/Sidebar";
import useLanguage, { polyglotState } from "./hooks/useLanguage";
import { useScreenWidth } from "./hooks/useScreenWidth";
import useTheme from "./hooks/useTheme";

const App = () => {
  useLanguage();
  useTheme();

  const { isBelowLarge } = useScreenWidth();

  const { polyglot } = useStore(polyglotState);

  if (!polyglot) {
    return null;
  }

  return (
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
  );
};

export default App;
