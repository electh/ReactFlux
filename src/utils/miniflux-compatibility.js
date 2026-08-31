import { ofetch } from "ofetch"

import compareVersions from "@/utils/version"

export const MINIMUM_MINIFLUX_VERSION = "2.3.2"

const MINIFLUX_RELEASE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/
const MINIFLUX_DEVELOPMENT_VERSION_PATTERN = /^(\d+\.\d+)\.x-dev$/
const MINIMUM_MINIFLUX_MAJOR_MINOR_VERSION = MINIMUM_MINIFLUX_VERSION.split(".")
  .slice(0, 2)
  .join(".")

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

  const developmentMajorMinorVersion = MINIFLUX_DEVELOPMENT_VERSION_PATTERN.exec(version)?.[1]

  if (!MINIFLUX_RELEASE_VERSION_PATTERN.test(version) && !developmentMajorMinorVersion) {
    return {
      minimumVersion: MINIMUM_MINIFLUX_VERSION,
      status: "unverifiable",
      version,
    }
  }

  const comparisonVersion = developmentMajorMinorVersion ?? version
  const minimumComparisonVersion = developmentMajorMinorVersion
    ? MINIMUM_MINIFLUX_MAJOR_MINOR_VERSION
    : MINIMUM_MINIFLUX_VERSION
  const isSupported = compareVersions(comparisonVersion, minimumComparisonVersion) >= 0

  return {
    minimumVersion: MINIMUM_MINIFLUX_VERSION,
    status: isSupported ? "supported" : "unsupported",
    version,
  }
}
