import React from "react";
import ReactDOM from "react-dom/client";
import "@arco-design/web-react/dist/css/arco.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Feed from "./Feed";
import All from "./All";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <All />,
      },
      {
        path: "/:c_id/:f_id",
        element: <Feed />,
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={router} />);
