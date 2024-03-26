import { ConfigProvider } from "@arco-design/web-react";
import "@arco-design/web-react/dist/css/arco.css";
import enUS from "@arco-design/web-react/es/locale/en-US";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import router from "./routes";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConfigProvider locale={enUS}>
    <RouterProvider router={router} />
  </ConfigProvider>,
);
