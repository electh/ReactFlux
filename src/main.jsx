import { ConfigProvider } from "@arco-design/web-react";
import "@arco-design/web-react/dist/css/arco.css";
import enUS from "@arco-design/web-react/es/locale/en-US";
import zhCN from "@arco-design/web-react/es/locale/zh-CN";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "simplebar-react/dist/simplebar.min.css";

import "./index.css";
import router from "./routes";
import "./theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConfigProvider locale={navigator.language === "zh-CN" ? zhCN : enUS}>
    <RouterProvider router={router} />
  </ConfigProvider>,
);
