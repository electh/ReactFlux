import { ConfigProvider } from "@arco-design/web-react";
import "@arco-design/web-react/dist/css/arco.css";
import enUS from "@arco-design/web-react/es/locale/en-US";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import All from "./All";
import App from "./App";
import ErrorPage from "./ErrorPage";
import Feed from "./Feed";
import Group from "./Group";
import History from "./History";
import Login from "./Login";
import Starred from "./Starred";
import RouterProtect from "./components/RouterProtect";
import "./index.css";

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
