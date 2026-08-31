import { Button, Message } from "@arco-design/web-react"
import { IconRefresh } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router"

import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"
import { dataState } from "@/store/dataState"
import {
  currentHomeTargetState,
  ensureCurrentHomePage,
  homeIdentityState,
  resetCurrentHomeTarget,
} from "@/store/homePageState"
import { settingsState } from "@/store/settingsState"
import {
  getHomeIdentityKey,
  getHomeTargetKey,
  getHomeTargetPath,
  isHomeTargetInCatalog,
} from "@/utils/home-page"

const HomePageManager = () => {
  const identity = useStore(homeIdentityState)
  const target = useStore(currentHomeTargetState)
  const { homePage: legacyHomePage, homePages } = useStore(settingsState, {
    keys: ["homePage", "homePages"],
  })
  const { loadState } = useStore(dataState, { keys: ["loadState"] })
  const { polyglot } = useStore(polyglotState)
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshIdentity } = useAppData()

  const identityKey = getHomeIdentityKey(identity)
  const targetKey = getHomeTargetKey(target)
  const catalogSnapshotRevision = loadState.catalog.snapshotRevision
  const hasIdentityMapping = homePages.entries.some(
    (entry) => getHomeIdentityKey(entry) === identityKey,
  )

  useEffect(() => {
    if (identityKey) {
      ensureCurrentHomePage()
    }
  }, [hasIdentityMapping, homePages.legacyMigrated, identityKey, legacyHomePage])

  useEffect(() => {
    const currentTarget = currentHomeTargetState.get()
    if (!identityKey || catalogSnapshotRevision === 0 || currentTarget.type === "view") {
      return
    }

    const { categoriesData, feedsData } = dataState.get()
    if (isHomeTargetInCatalog(currentTarget, feedsData, categoriesData)) {
      return
    }

    const invalidPath = getHomeTargetPath(currentTarget)
    if (resetCurrentHomeTarget()) {
      Message.warning(polyglot.t("home_page.fallback_notice"))
    }
    if (location.pathname === invalidPath || location.pathname.startsWith(`${invalidPath}/`)) {
      navigate("/all", { replace: true })
    }
  }, [catalogSnapshotRevision, identityKey, location.pathname, navigate, polyglot, targetKey])

  const identityLoadState = loadState.identity
  if (location.pathname === "/" || identityLoadState.hasSnapshot || !identityLoadState.error) {
    return null
  }

  return (
    <div className="home-identity-notice" role="status">
      <span>{polyglot.t("home_page.identity_error_inline")}</span>
      <Button
        icon={<IconRefresh aria-hidden="true" />}
        loading={identityLoadState.activity === "loading"}
        size="small"
        onClick={() => refreshIdentity({ force: true }).catch(() => null)}
      >
        {polyglot.t("actions.retry")}
      </Button>
    </div>
  )
}

export default HomePageManager
