import React from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

import App from "./App";
import All from "./pages/All";
import ErrorPage from "./pages/ErrorPage";
import Feed from "./pages/Feed";
import Group from "./pages/Group";
import History from "./pages/History";
import Login from "./pages/Login";
import RouterProtect from "./pages/RouterProtect";
import Starred from "./pages/Starred";
import Today from "./pages/Today";
import { getConfig } from "./utils/config";

const homePage = getConfig("homePage");

const children = [
  {
    path: "/all",
    element: <All />,
  },
  {
    path: "/today",
    element: <Today />,
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
    path: "/group/:id",
    element: <Group />,
  },
  {
    path: "/feed/:id",
    element: <Feed />,
  },
];

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
      ...children,
      { index: true, element: <Navigate to={`/${homePage}`} replace /> },
    ],
  },
  { path: "/login", element: <Login /> },
]);

export default router;
