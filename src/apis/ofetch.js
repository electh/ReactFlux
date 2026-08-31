import { ofetch } from "ofetch"

import router from "@/routes"
import { authState } from "@/store/authState"
import { getDataSessionRevision } from "@/store/dataState"
import isValidAuth from "@/utils/auth"
import { clearSession } from "@/utils/session"

const REQUEST_AUTH_SESSION_KEY = Symbol("requestAuth")

const createRequestSessionSnapshot = ({ server, token, username, password }) => ({
  password,
  revision: getDataSessionRevision(),
  server,
  token,
  username,
})

const isCurrentRequestSession = (requestSession, auth) =>
  Boolean(requestSession) &&
  requestSession.revision === getDataSessionRevision() &&
  requestSession.server === auth.server &&
  requestSession.token === auth.token &&
  requestSession.username === auth.username &&
  requestSession.password === auth.password

// 创建 ofetch 实例并设置默认配置
const createApiClient = () => {
  return ofetch.create({
    retry: 3, // 默认重试次数
    onRequest({ _request, options }) {
      const auth = authState.get()
      const requestSession = options[REQUEST_AUTH_SESSION_KEY]

      if (requestSession && !isCurrentRequestSession(requestSession, auth)) {
        throw new Error("Stale auth request")
      }
      if (!isValidAuth(auth)) {
        throw new Error("Invalid auth")
      }

      options[REQUEST_AUTH_SESSION_KEY] = createRequestSessionSnapshot(auth)
      const { server, token, username, password } = auth
      options.baseURL = server
      options.headers = token
        ? { "X-Auth-Token": token }
        : { Authorization: `Basic ${btoa(`${username}:${password}`)}` }
    },
    onRequestError({ _request, _options, error }) {
      // 处理请求错误
      console.error("Request error:", error)
    },
    onResponse({ options }) {
      if (!isCurrentRequestSession(options[REQUEST_AUTH_SESSION_KEY], authState.get())) {
        throw new Error("Stale auth response")
      }
    },
    async onResponseError({ response, options }) {
      const statusCode = response.status
      if (
        statusCode === 401 &&
        isCurrentRequestSession(options[REQUEST_AUTH_SESSION_KEY], authState.get())
      ) {
        const { location } = router.state
        const from = `${location.pathname}${location.search}${location.hash}`
        clearSession()
        await router.navigate("/login", { replace: true, state: { from } })
      }
      // 处理响应错误
      const errorMessage = response._data?.error_message ?? response.statusText
      console.error("Response error:", errorMessage)
      const responseError = new Error(errorMessage)
      responseError.status = statusCode
      responseError.data = response._data
      throw responseError
    },
  })
}

const apiClient = createApiClient()
apiClient.get = (url, options = {}) => apiClient(url, { ...options, method: "GET" })
apiClient.post = (url, body, options = {}) => apiClient(url, { ...options, method: "POST", body })
apiClient.put = (url, body, options = {}) => apiClient(url, { ...options, method: "PUT", body })

export default apiClient
