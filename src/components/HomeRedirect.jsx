import { Button, Result, Spin } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { Navigate, useNavigate } from "react-router"

import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"
import { dataState } from "@/store/dataState"
import { currentHomeTargetState, homeIdentityState } from "@/store/homePageState"
import { getHomeTargetPath, isHomeTargetInCatalog } from "@/utils/home-page"
import { clearSession } from "@/utils/session"

import "./HomeRedirect.css"

const LoadingState = ({ label }) => (
  <main aria-busy="true" className="home-route-state" role="status">
    <Spin aria-hidden="true" />
    <p>{label}</p>
  </main>
)

const ErrorState = ({ description, logoutLabel, retryLabel, title, onLogout, onRetry }) => (
  <main className="home-route-state" role="alert">
    <Result
      status="error"
      subTitle={description}
      title={title}
      extra={
        <div className="home-route-actions">
          <Button type="primary" onClick={onRetry}>
            {retryLabel}
          </Button>
          <Button onClick={onLogout}>{logoutLabel}</Button>
        </div>
      }
    />
  </main>
)

const HomeRedirect = () => {
  const identity = useStore(homeIdentityState)
  const target = useStore(currentHomeTargetState)
  const { categoriesData, feedsData, loadState } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const { refreshFeedData, refreshIdentity } = useAppData()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearSession()
    navigate("/login", { replace: true, state: { from: "/" } })
  }

  if (!loadState.identity.hasSnapshot || !identity) {
    if (loadState.identity.error) {
      return (
        <ErrorState
          description={polyglot.t("home_page.identity_error_description")}
          logoutLabel={polyglot.t("sidebar.logout")}
          retryLabel={polyglot.t("actions.retry")}
          title={polyglot.t("home_page.identity_error_title")}
          onLogout={handleLogout}
          onRetry={() => refreshIdentity({ force: true }).catch(() => null)}
        />
      )
    }

    return <LoadingState label={polyglot.t("home_page.identity_loading")} />
  }

  if (target.type === "view") {
    return <Navigate replace to={getHomeTargetPath(target)} />
  }

  if (!loadState.catalog.hasSnapshot) {
    if (loadState.catalog.error) {
      return (
        <ErrorState
          description={polyglot.t("home_page.catalog_error_description")}
          logoutLabel={polyglot.t("sidebar.logout")}
          retryLabel={polyglot.t("actions.retry")}
          title={polyglot.t("home_page.catalog_error_title")}
          onLogout={handleLogout}
          onRetry={() => refreshFeedData({ force: true }).catch(() => null)}
        />
      )
    }

    return <LoadingState label={polyglot.t("home_page.catalog_loading")} />
  }

  const targetExists = isHomeTargetInCatalog(target, feedsData, categoriesData)
  return <Navigate replace to={targetExists ? getHomeTargetPath(target) : "/all"} />
}

export default HomeRedirect
