import { ConfigProvider } from "@arco-design/web-react";
import "@arco-design/web-react/dist/css/arco.css";
import enUS from "@arco-design/web-react/es/locale/en-US";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "simplebar-react/dist/simplebar.min.css";

import "./index.css";
import router from "./routes";
import "./theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConfigProvider locale={enUS}>
    <RouterProvider router={router} />
  </ConfigProvider>,
);
