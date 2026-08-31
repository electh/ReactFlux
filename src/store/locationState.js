import { atom } from "nanostores"

export const currentRoutePathState = atom("/")

export const setCurrentRoutePath = (path) => currentRoutePathState.set(path)
