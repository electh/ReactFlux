import { ofetch } from "ofetch"

import compareVersions from "@/utils/version"

export const MINIMUM_MINIFLUX_VERSION = "2.3.2"

const MINIFLUX_RELEASE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/

const getAuthHeaders = ({ token, username, password }) =>
  token ? { "X-Auth-Token": token } : { Authorization: `Basic ${btoa(`${username}:${password}`)}` }

const createCompatibilityRequestError = (error) => {
  const requestError = new Error(error instanceof Error ? error.message : String(error))
  requestError.name = "MinifluxCompatibilityError"
  requestError.status = error?.response?.status ?? error?.status
  return requestError
}

export const checkMinifluxCompatibility = async (auth, { signal } = {}) => {
  let response

  try {
    response = await ofetch("v1/version", {
      baseURL: auth.server,
      headers: getAuthHeaders(auth),
      redirect: "error",
      signal,
    })
  } catch (error) {
    throw createCompatibilityRequestError(error)
  }

  const version = typeof response?.version === "string" ? response.version : ""

  if (!MINIFLUX_RELEASE_VERSION_PATTERN.test(version)) {
    return {
      minimumVersion: MINIMUM_MINIFLUX_VERSION,
      status: "unverifiable",
      version,
    }
  }

  return {
    minimumVersion: MINIMUM_MINIFLUX_VERSION,
    status: compareVersions(version, MINIMUM_MINIFLUX_VERSION) >= 0 ? "supported" : "unsupported",
    version,
  }
}
