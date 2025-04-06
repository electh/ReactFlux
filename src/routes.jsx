import { createBrowserRouter, Navigate } from "react-router"

import App from "./App"
import All from "./pages/All"
import Category from "./pages/Category"
import ErrorPage from "./pages/ErrorPage"
import Feed from "./pages/Feed"
import History from "./pages/History"
import Login from "./pages/Login"
import RouterProtect from "./pages/RouterProtect"
import Starred from "./pages/Starred"
import Today from "./pages/Today"
import { getSettings } from "./store/settingsState"

const homePage = getSettings("homePage")

const children = [
  { path: "/all", element: <All /> },
  { path: "/today", element: <Today /> },
  { path: "/starred", element: <Starred /> },
  { path: "/history", element: <History /> },
  { path: "/category/:id", element: <Category /> },
  { path: "/feed/:id", element: <Feed /> },
]

const router = createBrowserRouter(
  [
    { path: "/login", element: <Login /> },
    {
      path: "/",
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
        {
          element: <RouterProtect />,
          children: [
            ...children,
            { index: true, element: <Navigate replace to={`/${homePage}`} /> },
          ],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)

export default router
