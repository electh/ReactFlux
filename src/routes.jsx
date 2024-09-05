import { Navigate, createBrowserRouter } from "react-router-dom";

import App from "./App";
import All from "./pages/All";
import Category from "./pages/Category";
import ErrorPage from "./pages/ErrorPage";
import Feed from "./pages/Feed";
import History from "./pages/History";
import Login from "./pages/Login";
import RouterProtect from "./pages/RouterProtect";
import Starred from "./pages/Starred";
import Today from "./pages/Today";
import { getConfig } from "./store/configState";

const homePage = getConfig("homePage");

const children = [
  { path: "/all", element: <All /> },
  { path: "/today", element: <Today /> },
  { path: "/starred", element: <Starred /> },
  { path: "/history", element: <History /> },
  { path: "/category/:id", element: <Category /> },
  { path: "/feed/:id", element: <Feed /> },
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
