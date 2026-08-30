import { resetAuth, setAuth } from "@/store/authState"
import { resetContent } from "@/store/contentState"
import { resetData, setVerifiedServer } from "@/store/dataState"
import { resetFeedIcons } from "@/store/feedIconsState"
import { getAuthSessionKey } from "@/utils/auth"

export const resetSessionData = () => {
  resetContent()
  resetData()
  resetFeedIcons()
}

export const clearSession = () => {
  resetAuth()
  resetSessionData()
}

export const startSession = (auth, serverVersion) => {
  resetSessionData()
  setVerifiedServer({ authSessionKey: getAuthSessionKey(auth), version: serverVersion })
  setAuth(auth)
}
