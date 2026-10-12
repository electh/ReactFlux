import { useStore } from "@nanostores/react"
import { useMatch } from "react-router"

import { getHomeEntries } from "@/apis/entries"
import Content from "@/components/Content/Content"
import HomeEditorial from "@/components/Home/HomeEditorial"
import RouteLoadingState from "@/components/ui/RouteLoadingState"
import { polyglotState } from "@/hooks/useLanguage"
import { dataState } from "@/store/dataState"
import { homeIdentityState } from "@/store/homePageState"

const Home = () => {
  const match = useMatch("/entry/:entryId")
  const identity = useStore(homeIdentityState)
  const { loadState } = useStore(dataState, { keys: ["loadState"] })
  const { polyglot } = useStore(polyglotState)

  if (!loadState.identity.hasSnapshot || !identity) {
    // HomePageManager owns identity failure recovery for both root routes.
    return loadState.identity.error ? null : (
      <RouteLoadingState label={polyglot.t("home_page.identity_loading")} />
    )
  }

  return (
    <Content
      entryIdOverride={match?.params.entryId}
      getEntries={getHomeEntries}
      info={{ from: "home", id: "" }}
      listContent={HomeEditorial}
    />
  )
}

export default Home
