import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./theme.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";
import "@arco-themes/react-theme-8br/css/arco.css";
import { ConfigProvider } from "@arco-design/web-react";
import enUS from "@arco-design/web-react/es/locale/en-US";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ConfigProvider locale={enUS}>
    <RouterProvider router={router} />
  </ConfigProvider>,
);
