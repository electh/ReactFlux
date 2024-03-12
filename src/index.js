import React from "react";
import ReactDOM from "react-dom/client";
import "@arco-design/web-react/dist/css/arco.css";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Feed from "./Feed";
import All from "./All";
import Login from "./Login";
import RouterProtect from "./components/RouterProtect";
import ErrorPage from "./ErrorPage";
import Group from "./Group";
import History from "./History";
import Starred from "./Starred";
import { ConfigProvider } from "@arco-design/web-react";
import enUS from "@arco-design/web-react/es/locale/en-US";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RouterProtect>
        <App />
      </RouterProtect>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <All />,
      },
      {
        path: "/starred",
        element: <Starred />,
      },
      {
        path: "/history",
        element: <History />,
      },
      {
        path: "/group/:c_id",
        element: <Group />,
      },
      {
        path: "/feed/:f_id",
        element: <Feed />,
      },
    ],
  },
  { path: "/login", element: <Login /> },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ConfigProvider locale={enUS}>
    <RouterProvider router={router} />
  </ConfigProvider>,
);

export { router };
