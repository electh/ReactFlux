import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import AppDataContext from "@/contexts/app-data-context"
import createAppDataCoordinator from "@/data/app-data-coordinator"
import { authState } from "@/store/authState"

const SessionAppDataProvider = ({ children }) => {
  const [coordinator] = useState(createAppDataCoordinator)

  useEffect(() => {
    void coordinator.bootstrap()
    return () => coordinator.dispose()
  }, [coordinator])

  return <AppDataContext.Provider value={coordinator.actions}>{children}</AppDataContext.Provider>
}

const AppDataProvider = ({ children }) => {
  const { password, server, token, username } = useStore(authState)
  const sessionKey = JSON.stringify([server, token, username, password])

  return <SessionAppDataProvider key={sessionKey}>{children}</SessionAppDataProvider>
}

export default AppDataProvider
