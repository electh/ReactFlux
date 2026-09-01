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
  all: "all",
  today: "today",
  starred: "starred",
  history: "history",
  "category/:id": "category",
  "feed/:id": "feed",
}

const loadContentPage = (pageKey) => async () => {
  const { default: contentPageComponents } = await import("./pages/ContentPages")
  return { Component: contentPageComponents[pageKey] }
}

const routes = Object.entries(pageRoutes).flatMap(([path, pageKey]) => [
  { path: `/${path}`, lazy: loadContentPage(pageKey) },
  { path: `/${path}/entry/:entryId`, lazy: loadContentPage(pageKey) },
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
