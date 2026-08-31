import { createBrowserRouter } from "react-router"

const lazyRoute = (loadRoute) => async () => {
  const { default: Component, ...routeModule } = await loadRoute()
  return { Component, ...routeModule }
}

const loadAuthenticatedRoute = async () => {
  const [{ default: Component }, { default: ErrorBoundary }] = await Promise.all([
    import("./pages/AuthenticatedApp"),
    import("./pages/ErrorPage"),
  ])
  return { Component, ErrorBoundary }
}

const pageRoutes = {
  all: () => import("./pages/All"),
  today: () => import("./pages/Today"),
  starred: () => import("./pages/Starred"),
  history: () => import("./pages/History"),
  "category/:id": () => import("./pages/Category"),
  "feed/:id": () => import("./pages/Feed"),
}

const routes = Object.entries(pageRoutes).flatMap(([path, loadRoute]) => [
  { path: `/${path}`, lazy: lazyRoute(loadRoute) },
  { path: `/${path}/entry/:entryId`, lazy: lazyRoute(loadRoute) },
])

const router = createBrowserRouter(
  [
    { path: "/login", lazy: lazyRoute(() => import("./pages/Login")) },
    {
      lazy: lazyRoute(() => import("./pages/RouterProtect")),
      children: [
        {
          path: "/",
          lazy: loadAuthenticatedRoute,
          children: [
            ...routes,
            { index: true, lazy: lazyRoute(() => import("./components/HomeRedirect")) },
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
