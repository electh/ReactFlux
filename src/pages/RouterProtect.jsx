import { Button, Result, Spin } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useRef, useState } from "react"
import { Navigate, Outlet, useLocation, useNavigate } from "react-router"

import useLanguage, { polyglotState } from "@/hooks/useLanguage"
import useTheme from "@/hooks/useTheme"
import { authState } from "@/store/authState"
import { dataState, setVerifiedServer } from "@/store/dataState"
import isValidAuth, { getAuthSessionKey } from "@/utils/auth"
import hideSpinner from "@/utils/loading"
import {
  checkMinifluxCompatibility,
  MINIMUM_MINIFLUX_VERSION,
} from "@/utils/miniflux-compatibility"
import { clearSession, resetSessionData } from "@/utils/session"
import "./RouterProtect.css"

const INITIAL_CHECK_STATE = { status: "checking" }

const CompatibilityGate = ({ checkState, onLogout, onRetry }) => {
  useLanguage()
  useTheme()

  const { polyglot } = useStore(polyglotState)
  const alertRef = useRef(null)

  useEffect(() => {
    if (polyglot) {
      hideSpinner()
    }
  }, [polyglot])

  useEffect(() => {
    if (polyglot && checkState.status === "error") {
      alertRef.current?.focus()
    }
  }, [checkState.status, polyglot])

  if (!polyglot) {
    return null
  }

  if (checkState.status === "checking") {
    return (
      <main className="compatibility-gate">
        <div
          aria-busy="true"
          aria-live="polite"
          className="compatibility-gate-status"
          role="status"
        >
          <Spin aria-hidden="true" />
          <p>{polyglot.t("compatibility.checking")}</p>
        </div>
      </main>
    )
  }

  const detectedVersion = checkState.version || polyglot.t("compatibility.unknown_version")
  const isUnverifiable = checkState.reason === "unverifiable"
  const title = polyglot.t(
    isUnverifiable ? "compatibility.unverifiable_title" : "compatibility.check_failed_title",
  )
  const description = polyglot.t(
    isUnverifiable
      ? "compatibility.unverifiable_description"
      : "compatibility.check_failed_description",
    {
      detectedVersion,
      minimumVersion: checkState.minimumVersion,
    },
  )

  return (
    <main className="compatibility-gate">
      <div ref={alertRef} className="compatibility-gate-result" role="alert" tabIndex={-1}>
        <Result
          status="error"
          subTitle={description}
          title={title}
          extra={
            <div className="compatibility-gate-actions">
              <Button type="primary" onClick={onRetry}>
                {polyglot.t("actions.retry")}
              </Button>
              <Button type="secondary" onClick={onLogout}>
                {polyglot.t("sidebar.logout")}
              </Button>
            </div>
          }
        />
      </div>
    </main>
  )
}

const RouterProtect = () => {
  const auth = useStore(authState)
  const { verifiedAuthSessionKey, version } = useStore(dataState)
  const location = useLocation()
  const navigate = useNavigate()
  const [retryCount, setRetryCount] = useState(0)
  const [checkState, setCheckState] = useState(INITIAL_CHECK_STATE)

  const { password, server, token, username } = auth
  const authSessionKey = getAuthSessionKey(auth)
  const hasValidAuth = isValidAuth(auth)
  const hasVerifiedSession = Boolean(version) && verifiedAuthSessionKey === authSessionKey
  const currentLocation = `${location.pathname}${location.search}${location.hash}`
  const activeCheckState =
    checkState.authSessionKey === authSessionKey ? checkState : INITIAL_CHECK_STATE

  useEffect(() => {
    if (!hasValidAuth || hasVerifiedSession) {
      return
    }

    if (version || verifiedAuthSessionKey) {
      resetSessionData()
      return
    }

    const abortController = new AbortController()
    let isActive = true

    const checkCompatibility = async () => {
      try {
        const result = await checkMinifluxCompatibility(
          { password, server, token, username },
          { signal: abortController.signal },
        )

        if (!isActive) {
          return
        }

        if (result.status === "supported") {
          setVerifiedServer({ authSessionKey, version: result.version })
          return
        }

        if (result.status === "unsupported") {
          clearSession()
          void navigate("/login", {
            replace: true,
            state: {
              compatibilityError: {
                minimumVersion: result.minimumVersion,
                reason: result.status,
                server,
                version: result.version,
              },
              from: currentLocation,
            },
          })
          return
        }

        setCheckState({
          authSessionKey,
          minimumVersion: result.minimumVersion,
          reason: result.status,
          status: "error",
          version: result.version,
        })
      } catch (error) {
        if (!isActive) {
          return
        }

        if (error?.status === 401) {
          clearSession()
          void navigate("/login", { replace: true, state: { from: currentLocation } })
          return
        }

        console.error("Failed to check Miniflux compatibility:", {
          message: error instanceof Error ? error.message : String(error),
          status: error?.status,
        })
        setCheckState({
          authSessionKey,
          minimumVersion: MINIMUM_MINIFLUX_VERSION,
          reason: "check-failed",
          status: "error",
        })
      }
    }

    void checkCompatibility()

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [
    authSessionKey,
    retryCount,
    currentLocation,
    hasValidAuth,
    hasVerifiedSession,
    navigate,
    password,
    server,
    token,
    username,
    verifiedAuthSessionKey,
    version,
  ])

  if (!hasValidAuth) {
    return <Navigate replace state={{ from: currentLocation }} to="/login" />
  }

  if (hasVerifiedSession) {
    return <Outlet />
  }

  const handleLogout = () => {
    clearSession()
    void navigate("/login", { replace: true, state: { from: currentLocation } })
  }

  const handleRetry = () => {
    setCheckState({ authSessionKey, status: "checking" })
    setRetryCount((count) => count + 1)
  }

  return (
    <CompatibilityGate
      checkState={activeCheckState}
      onLogout={handleLogout}
      onRetry={handleRetry}
    />
  )
}

export default RouterProtect
