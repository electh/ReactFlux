import { resetAuth, setAuth } from "@/store/authState"
import { resetContent } from "@/store/contentState"
import { resetData } from "@/store/dataState"
import { resetFeedIcons } from "@/store/feedIconsState"

const resetSessionData = () => {
  resetContent()
  resetData()
  resetFeedIcons()
}

export const clearSession = () => {
  resetAuth()
  resetSessionData()
}

export const startSession = (auth) => {
  resetSessionData()
  setAuth(auth)
}
