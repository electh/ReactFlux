import { useContext } from "react"

import AppDataContext from "@/contexts/app-data-context"

const useAppData = () => {
  const appData = useContext(AppDataContext)

  if (!appData) {
    throw new Error("useAppData must be used within AppDataProvider")
  }

  return appData
}

export default useAppData
