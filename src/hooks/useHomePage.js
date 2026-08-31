import { useStore } from "@nanostores/react"
import { useMemo } from "react"

import { polyglotState } from "@/hooks/useLanguage"
import { catalogCategoriesState, catalogFeedsState, dataState } from "@/store/dataState"
import {
  currentHomeTargetState,
  homeIdentityState,
  setCurrentHomeTarget,
} from "@/store/homePageState"
import { getHomeTargetPath } from "@/utils/home-page"

const getViewLabel = (polyglot, id) => polyglot.t(`settings.default_home_page_option_${id}`)

export const describeHomeTarget = ({ categories, feeds, polyglot, target }) => {
  if (target.type === "view") {
    const name = getViewLabel(polyglot, target.id)
    return {
      label: `${polyglot.t("home_page.type_view")} · ${name}`,
      name,
    }
  }

  if (target.type === "category") {
    const category = categories.find((item) => item.id === target.id)
    const name = category?.title ?? polyglot.t("home_page.loading")
    return {
      label: `${polyglot.t("home_page.type_category")} · ${name}`,
      name,
    }
  }

  const feed = feeds.find((item) => item.id === target.id)
  const categoryName = feed?.category?.title
  const feedName = feed?.title
  const name =
    categoryName && feedName ? `${categoryName} / ${feedName}` : polyglot.t("home_page.loading")

  return {
    label: `${polyglot.t("home_page.type_feed")} · ${name}`,
    name,
  }
}

const useHomePage = () => {
  const target = useStore(currentHomeTargetState)
  const identity = useStore(homeIdentityState)
  const categories = useStore(catalogCategoriesState)
  const feeds = useStore(catalogFeedsState)
  const { loadState } = useStore(dataState, { keys: ["loadState"] })
  const { polyglot } = useStore(polyglotState)

  const description = useMemo(
    () => describeHomeTarget({ categories, feeds, polyglot, target }),
    [categories, feeds, polyglot, target],
  )

  const identityReady = Boolean(identity && loadState.identity.hasSnapshot)
  const identityError = identityReady ? null : loadState.identity.error

  return {
    ...description,
    categories,
    feeds,
    identity,
    identityError,
    identityReady,
    path: getHomeTargetPath(target),
    setTarget: setCurrentHomeTarget,
    target,
  }
}

export default useHomePage
