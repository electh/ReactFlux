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
root.render(<RouterProvider router={router} />);

export { router };
