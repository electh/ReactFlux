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

const pageRoutes = {
  all: <All />,
  today: <Today />,
  starred: <Starred />,
  history: <History />,
  "category/:id": <Category />,
  "feed/:id": <Feed />,
}

const routes = Object.entries(pageRoutes).flatMap(([path, element]) => [
  { path: `/${path}`, element },
  { path: `/${path}/entry/:entryId`, element },
])

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
          children: [...routes, { index: true, element: <Navigate replace to={`/${homePage}`} /> }],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)

export default router
