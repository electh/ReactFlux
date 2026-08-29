import { Button, Spin } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { Component, lazy, Suspense } from "react"

import { polyglotState } from "@/hooks/useLanguage"
import { loadSettingsTabs } from "@/utils/settings-loader"

const SettingsLoadingState = ({ label }) => (
  <div aria-busy="true" className="settings-modal-loading" role="status">
    <Spin aria-hidden="true" />
    <span>{label}</span>
  </div>
)

const SettingsLoadErrorState = ({
  closeLabel,
  description,
  retryLabel,
  title,
  onClose,
  onRetry,
}) => (
  <div className="settings-modal-load-error" role="alert">
    <h2 className="settings-modal-load-error-title">{title}</h2>
    <p className="settings-modal-load-error-description">{description}</p>
    <div className="settings-modal-load-error-actions">
      <Button autoFocus type="primary" onClick={onRetry}>
        {retryLabel}
      </Button>
      <Button onClick={onClose}>{closeLabel}</Button>
    </div>
  </div>
)

let cachedSettingsTabs = lazy(loadSettingsTabs)

const createSettingsTabsLoadState = () => ({
  hasError: false,
  LazySettingsTabs: cachedSettingsTabs,
})

const resetCachedSettingsTabs = () => {
  cachedSettingsTabs = lazy(loadSettingsTabs)
}

class SettingsTabsBoundary extends Component {
  state = createSettingsTabsLoadState()

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    resetCachedSettingsTabs()
    console.error("Failed to load settings:", error, errorInfo)
  }

  handleRetry = () => this.setState(createSettingsTabsLoadState())

  render() {
    const {
      activeTab,
      closeLabel,
      errorDescription,
      errorTitle,
      loadingLabel,
      retryLabel,
      onClose,
      onTabChange,
    } = this.props
    const { hasError, LazySettingsTabs } = this.state

    if (hasError) {
      return (
        <SettingsLoadErrorState
          closeLabel={closeLabel}
          description={errorDescription}
          retryLabel={retryLabel}
          title={errorTitle}
          onClose={onClose}
          onRetry={this.handleRetry}
        />
      )
    }

    return (
      <Suspense fallback={<SettingsLoadingState label={loadingLabel} />}>
        <LazySettingsTabs activeTab={activeTab} onTabChange={onTabChange} />
      </Suspense>
    )
  }
}

const SettingsModalContent = ({ activeTab, onClose, onTabChange }) => {
  const { polyglot } = useStore(polyglotState)

  return (
    <SettingsTabsBoundary
      activeTab={activeTab}
      errorDescription={polyglot.t("settings.load_error_description")}
      errorTitle={polyglot.t("settings.load_error")}
      loadingLabel={polyglot.t("settings.loading")}
      retryLabel={polyglot.t("actions.retry")}
      closeLabel={polyglot.t("actions.close_dialog", {
        name: polyglot.t("sidebar.settings"),
      })}
      onClose={onClose}
      onTabChange={onTabChange}
    />
  )
}

export default SettingsModalContent
