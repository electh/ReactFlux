import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  Link,
  Message,
  Notification,
  Typography,
} from "@arco-design/web-react"
import useForm from "@arco-design/web-react/es/Form/useForm"
import { IconHome, IconLock, IconUser } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { ofetch } from "ofetch"
import { useEffect, useState } from "react"
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router"

import useLanguage, { polyglotState } from "@/hooks/useLanguage"
import useTheme from "@/hooks/useTheme"
import { authState } from "@/store/authState"
import isValidAuth from "@/utils/auth"
import { handleEnterKeyToSubmit, validateAndFormatFormFields } from "@/utils/form"
import hideSpinner from "@/utils/loading"
import {
  checkMinifluxCompatibility,
  MINIMUM_MINIFLUX_VERSION,
} from "@/utils/miniflux-compatibility"
import { startSession } from "@/utils/session"
import "./Login.css"

const getSafeRequestErrorDetails = (error) => ({
  message: error instanceof Error ? error.message : String(error),
  status: error?.status ?? error?.response?.status,
})

const getCompatibilityAlert = (polyglot, compatibilityError) => {
  const variables = {
    detectedVersion: compatibilityError.version || polyglot.t("compatibility.unknown_version"),
    minimumVersion: compatibilityError.minimumVersion,
  }

  if (compatibilityError.reason === "unsupported") {
    return {
      content: polyglot.t("compatibility.unsupported_description", variables),
      title: polyglot.t("compatibility.unsupported_title"),
    }
  }

  if (compatibilityError.reason === "unverifiable") {
    return {
      content: polyglot.t("compatibility.unverifiable_description", variables),
      title: polyglot.t("compatibility.unverifiable_title"),
    }
  }

  return {
    content: polyglot.t("compatibility.check_failed_description", variables),
    title: polyglot.t("compatibility.check_failed_title"),
  }
}

const Login = () => {
  useLanguage()
  useTheme()

  const auth = useStore(authState)
  const { polyglot } = useStore(polyglotState)

  const [loginForm] = useForm()
  const [loading, setLoading] = useState(false)

  const [searchParams] = useSearchParams()
  const [authMethod, setAuthMethod] = useState(() =>
    Object.fromEntries(searchParams).username ? "user" : "token",
  )
  /* token or user */
  const location = useLocation()
  const navigate = useNavigate()
  const compatibilityErrorFromNavigation = location.state?.compatibilityError

  const [redirectTo] = useState(() => location.state?.from)
  const [compatibilityError, setCompatibilityError] = useState(
    compatibilityErrorFromNavigation ?? null,
  )
  const redirectedServer = compatibilityErrorFromNavigation?.server

  const performHealthCheck = async (auth) => {
    setLoading(true)
    setCompatibilityError(null)
    const { server, token, username, password } = auth
    const headers = token
      ? { "X-Auth-Token": token }
      : { Authorization: `Basic ${btoa(`${username}:${password}`)}` }

    try {
      let response

      try {
        response = await ofetch.raw("v1/me", {
          baseURL: server,
          headers,
          redirect: "error",
        })
      } catch (error) {
        const errorDetails = getSafeRequestErrorDetails(error)
        console.error("Login health check failed:", errorDetails)
        Notification.error({
          title: polyglot.t("login.error"),
          content: errorDetails.message,
        })
        return
      }

      if (response.status !== 200) {
        return
      }

      const currentUser = response._data
      const userId = currentUser?.id
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        Notification.error({
          title: polyglot.t("login.error"),
          content: polyglot.t("login.invalid_identity"),
        })
        return
      }

      let compatibility

      try {
        compatibility = await checkMinifluxCompatibility(auth)
      } catch (error) {
        console.error("Failed to check Miniflux compatibility:", getSafeRequestErrorDetails(error))
        setCompatibilityError({
          minimumVersion: MINIMUM_MINIFLUX_VERSION,
          reason: "check-failed",
          server,
        })
        return
      }

      if (compatibility.status !== "supported") {
        setCompatibilityError({
          minimumVersion: compatibility.minimumVersion,
          reason: compatibility.status,
          server,
          version: compatibility.version,
        })
        return
      }

      Notification.success({
        title: polyglot.t("login.success"),
      })
      startSession({ server, token, username, password }, compatibility.version, currentUser)
      navigate(redirectTo || "/", { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (auth) => {
    if (!isValidAuth(auth)) {
      Message.error(polyglot.t("login.auth_error"))
      return
    }
    await performHealthCheck(auth)
  }

  useEffect(() => {
    hideSpinner()
  }, [])

  useEffect(() => {
    const url = new URL(globalThis.location.href)
    const { server, token, username, password } = Object.fromEntries(url.searchParams)
    if (server) {
      loginForm.setFieldsValue({ server, token, username, password })
      loginForm.submit()
    } else if (redirectedServer) {
      loginForm.setFieldsValue({ server: redirectedServer })
    }
  }, [loginForm, polyglot, redirectedServer])

  const compatibilityAlert =
    polyglot && compatibilityError ? getCompatibilityAlert(polyglot, compatibilityError) : null

  if (isValidAuth(auth)) {
    return <Navigate replace to={redirectTo || "/"} />
  }

  return (
    polyglot && (
      <div className="page-layout">
        <div className="form-panel">
          <div className="login-form">
            <Typography.Title heading={3}>
              {polyglot.t("login.login_to_your_server")}
            </Typography.Title>
            {compatibilityAlert && (
              <Alert
                className="login-compatibility-alert"
                content={compatibilityAlert.content}
                title={compatibilityAlert.title}
                type="error"
              />
            )}
            <Form
              autoComplete="off"
              form={loginForm}
              layout="vertical"
              onSubmit={async () => {
                if (validateAndFormatFormFields(loginForm)) {
                  history.replaceState(history.state, "", "/login")
                  await handleLogin(loginForm.getFieldsValue())
                } else {
                  Message.error(polyglot.t("login.submit_error"))
                }
              }}
            >
              <Form.Item
                field="server"
                label={polyglot.t("login.server_label")}
                rules={[{ required: true }]}
                onKeyDown={(event) => {
                  handleEnterKeyToSubmit(event, loginForm)
                }}
              >
                <Input
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={loading}
                  inputMode="url"
                  placeholder={polyglot.t("login.server_placeholder")}
                  prefix={<IconHome aria-hidden="true" />}
                  spellCheck={false}
                />
              </Form.Item>
              {authMethod === "token" && (
                <Form.Item
                  field="token"
                  label={polyglot.t("login.token_label")}
                  rules={[{ required: true }]}
                  onKeyDown={(event) => {
                    handleEnterKeyToSubmit(event, loginForm)
                  }}
                >
                  <Input.Password
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={loading}
                    placeholder={polyglot.t("login.token_placeholder")}
                    prefix={<IconLock aria-hidden="true" />}
                    spellCheck={false}
                  />
                </Form.Item>
              )}
              {authMethod === "user" && (
                <>
                  <Form.Item
                    field="username"
                    label={polyglot.t("login.username_label")}
                    rules={[{ required: true }]}
                    onKeyDown={(event) => {
                      handleEnterKeyToSubmit(event, loginForm)
                    }}
                  >
                    <Input
                      autoCapitalize="none"
                      autoCorrect="off"
                      disabled={loading}
                      placeholder={polyglot.t("login.username_placeholder")}
                      prefix={<IconUser aria-hidden="true" />}
                      spellCheck={false}
                    />
                  </Form.Item>
                  <Form.Item
                    field="password"
                    label={polyglot.t("login.password_label")}
                    rules={[{ required: true }]}
                    onKeyDown={(event) => {
                      handleEnterKeyToSubmit(event, loginForm)
                    }}
                  >
                    <Input.Password
                      autoCapitalize="none"
                      autoCorrect="off"
                      disabled={loading}
                      placeholder={polyglot.t("login.password_placeholder")}
                      prefix={<IconLock aria-hidden="true" />}
                      spellCheck={false}
                    />
                  </Form.Item>
                </>
              )}
            </Form>
            <Button
              loading={loading}
              long={true}
              style={{ marginTop: "20px" }}
              type="primary"
              onClick={() => loginForm.submit()}
            >
              {polyglot.t("login.login_button")}
            </Button>
            <Divider>{polyglot.t("login.another_login_method")}</Divider>
            <Button
              long={true}
              style={{ marginTop: "20px" }}
              type="secondary"
              onClick={() => setAuthMethod(authMethod === "token" ? "user" : "token")}
            >
              {authMethod === "token"
                ? polyglot.t("login.another_login_button")
                : polyglot.t("login.token_label")}
            </Button>
            <div className="login-help">
              <Typography.Text disabled>{polyglot.t("login.need_help")}</Typography.Text>
              <Link
                href={"https://miniflux.app/docs/api.html#authentication"}
                style={{ fontWeight: "500" }}
              >
                {polyglot.t("login.miniflux_official_website")}
              </Link>
            </div>
          </div>
        </div>
        <div className="background" />
      </div>
    )
  )
}

export default Login
