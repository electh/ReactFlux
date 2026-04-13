import { Button, Divider, Input, InputNumber, Select, Switch } from "@arco-design/web-react"
import { IconDownload, IconUpload } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import SettingItem from "./SettingItem"
import "./SettingItem.css"
import "./Content.css"

import { exportOPML, importOPML } from "@/apis"
import AiSpark from "@/components/icons/AiSpark"
import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"
import { AI_PROVIDERS, fetchProviderModels } from "@/utils/ai"
import { Notification } from "@/utils/feedback"

const readFileAsText = async (file) => {
  try {
    return await file.text()
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
}

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type })
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  globalThis.URL.revokeObjectURL(url)
}

const Content = () => {
  const { polyglot } = useStore(polyglotState)
  const settings = useStore(settingsState)

  const [importing, setImporting] = useState(false)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState(false)
  const [modelOptions, setModelOptions] = useState([])

  const isProviderNone = settings.aiProvider === AI_PROVIDERS.NONE
  const isOllamaProvider = settings.aiProvider === AI_PROVIDERS.OLLAMA
  const isLmStudioProvider = settings.aiProvider === AI_PROVIDERS.LM_STUDIO
  const currentApiKey = settings.aiApiKeys?.[settings.aiProvider] ?? ""
  const currentModel = settings.aiModels?.[settings.aiProvider] ?? ""
  const normalizedModelOptions = modelOptions.map((model) =>
    typeof model === "string" ? { id: model, label: model } : model,
  )
  const modelIds = normalizedModelOptions.map((model) => model.id)
  const apiCredentialLabel = isOllamaProvider
    ? polyglot.t("settings.content.ai_ollama_url_label")
    : isLmStudioProvider
      ? polyglot.t("settings.content.ai_lmstudio_url_label")
      : polyglot.t("settings.content.ai_api_key_label")
  const apiCredentialDescription = isOllamaProvider
    ? polyglot.t("settings.content.ai_ollama_url_description")
    : isLmStudioProvider
      ? polyglot.t("settings.content.ai_lmstudio_url_description")
      : polyglot.t("settings.content.ai_api_key_description")
  const apiCredentialPlaceholder = isOllamaProvider
    ? polyglot.t("settings.content.ai_ollama_url_placeholder")
    : isLmStudioProvider
      ? polyglot.t("settings.content.ai_lmstudio_url_placeholder")
      : polyglot.t("settings.content.ai_api_key_label")
  const ApiCredentialInput = isOllamaProvider || isLmStudioProvider ? Input : Input.Password
  const isCombinedLayout = settings.layoutMode === "stream"

  useEffect(() => {
    let isActive = true

    const loadModels = async () => {
      if (isProviderNone) {
        if (isActive) {
          setModelOptions([])
          setModelsLoading(false)
          setModelsError(false)
        }
        return
      }

      if (!currentApiKey) {
        if (isActive) {
          setModelOptions([])
          setModelsLoading(false)
          setModelsError(false)
        }
        return
      }

      if (isActive) {
        setModelOptions([])
      }
      setModelsLoading(true)
      setModelsError(false)
      try {
        const detected = await fetchProviderModels(settings.aiProvider, currentApiKey)
        if (isActive) {
          setModelOptions(detected)
        }
      } catch {
        if (isActive) {
          setModelsError(true)
        }
      } finally {
        if (isActive) {
          setModelsLoading(false)
        }
      }
    }

    loadModels()

    return () => {
      isActive = false
    }
  }, [isProviderNone, currentApiKey, settings.aiProvider])

  useEffect(() => {
    if (isProviderNone && (settings.aiModel || currentModel)) {
      updateSettings({
        aiModel: "",
        aiModels: {
          ...settings.aiModels,
          [settings.aiProvider]: "",
        },
      })
      return
    }

    if (!isProviderNone && (modelsLoading || modelsError)) {
      return
    }

    if (!isProviderNone && modelIds.length > 0 && !currentModel) {
      updateSettings({
        aiModel: modelIds[0],
        aiModels: {
          ...settings.aiModels,
          [settings.aiProvider]: modelIds[0],
        },
      })
    }
  }, [
    currentModel,
    isProviderNone,
    modelOptions,
    modelIds,
    modelsError,
    modelsLoading,
    settings.aiModel,
    settings.aiModels,
    settings.aiProvider,
  ])

  const handleExport = async () => {
    try {
      const opmlContent = await exportOPML()
      downloadFile(opmlContent, "feeds.opml", "text/xml")
      Notification.success({ title: polyglot.t("sidebar.export_opml_success") })
    } catch {
      Notification.error({ title: polyglot.t("sidebar.export_opml_error") })
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      return
    }

    setImporting(true)
    try {
      const fileContent = await readFileAsText(file)
      const response = await importOPML(fileContent)
      if (response.status === 201) {
        Notification.success({ title: polyglot.t("sidebar.import_opml_success") })
      } else {
        Notification.error({ title: polyglot.t("sidebar.import_opml_error") })
      }
    } catch (error) {
      Notification.error({ title: polyglot.t("sidebar.import_opml_error"), content: error.message })
    } finally {
      setImporting(false)
    }
  }

  const handleAiProviderChange = (value) => {
    setModelOptions([])
    setModelsLoading(false)
    setModelsError(false)
    updateSettings({
      aiProvider: value,
      aiModel: settings.aiModels?.[value] || "",
    })
  }

  return (
    <>
      <SettingItem
        description={polyglot.t("settings.content.show_hidden_description")}
        title={polyglot.t("sidebar.show_hidden_feeds")}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Switch
            checked={settings.showHiddenFeeds}
            onChange={(value) => updateSettings({ showHiddenFeeds: value })}
          />
        </div>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.feeds_show_unread_description")}
        title={polyglot.t("settings.content.feeds_show_unread_label")}
      >
        <Switch
          checked={settings.showUnreadFeedsOnly}
          onChange={(value) => updateSettings({ showUnreadFeedsOnly: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem title={polyglot.t("settings.content.import_export_label")}>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            icon={<IconUpload />}
            onClick={() => document.querySelector("#contentOpmlInput").click()}
          >
            {polyglot.t("sidebar.import_opml")}
          </Button>
          <input
            accept=".opml,.xml"
            disabled={importing}
            id="contentOpmlInput"
            style={{ display: "none" }}
            type="file"
            onChange={handleImport}
          />
          <Button icon={<IconDownload />} onClick={handleExport}>
            {polyglot.t("sidebar.export_opml")}
          </Button>
        </div>
      </SettingItem>

      <Divider />

      <div className="ai-settings-group">
        <div className="ai-settings-group__header">
          <div className="ai-settings-group__title">
            <AiSpark className="ai-settings-group__icon" />
            <span>{polyglot.t("settings.content.ai_group_label")}</span>
          </div>
          <div className="ai-settings-group__description">
            {polyglot.t("settings.content.ai_group_description")}
          </div>
        </div>

        <SettingItem
          description={polyglot.t("settings.content.ai_provider_description")}
          title={polyglot.t("settings.content.ai_provider_label")}
        >
          <Select
            className="input-select"
            value={settings.aiProvider}
            onChange={handleAiProviderChange}
          >
            <Select.Option value={AI_PROVIDERS.NONE}>
              {polyglot.t("settings.content.ai_provider_none")}
            </Select.Option>
            <Select.Option value={AI_PROVIDERS.ANTHROPIC}>
              {polyglot.t("settings.content.ai_provider_anthropic")}
            </Select.Option>
            <Select.Option value={AI_PROVIDERS.GEMINI}>
              {polyglot.t("settings.content.ai_provider_gemini")}
            </Select.Option>
            <Select.Option value={AI_PROVIDERS.OLLAMA}>
              {polyglot.t("settings.content.ai_provider_ollama")}
            </Select.Option>
            <Select.Option value={AI_PROVIDERS.LM_STUDIO}>
              {polyglot.t("settings.content.ai_provider_lmstudio")}
            </Select.Option>
            <Select.Option value={AI_PROVIDERS.PERPLEXITY}>
              {polyglot.t("settings.content.ai_provider_perplexity")}
            </Select.Option>
          </Select>
        </SettingItem>

        <Divider className="ai-settings-group__divider" />

        <SettingItem description={apiCredentialDescription} title={apiCredentialLabel}>
          <ApiCredentialInput
            allowClear
            className="input-select"
            disabled={isProviderNone}
            placeholder={apiCredentialPlaceholder}
            style={{ width: "30ch" }}
            value={currentApiKey}
            onChange={(value) =>
              updateSettings({
                aiApiKeys: {
                  ...settings.aiApiKeys,
                  [settings.aiProvider]: value,
                },
              })
            }
          />
        </SettingItem>

        <Divider className="ai-settings-group__divider" />

        <SettingItem
          description={polyglot.t("settings.content.ai_model_description")}
          title={polyglot.t("settings.content.ai_model_label")}
        >
          <Select
            className="input-select"
            disabled={isProviderNone || modelIds.length === 0}
            loading={modelsLoading}
            placeholder={polyglot.t("settings.content.ai_models_empty")}
            style={{ width: "30ch" }}
            value={currentModel || undefined}
            onChange={(value) =>
              updateSettings({
                aiModel: value || "",
                aiModels: {
                  ...settings.aiModels,
                  [settings.aiProvider]: value || "",
                },
              })
            }
          >
            {normalizedModelOptions.map((model) => (
              <Select.Option key={model.id} value={model.id}>
                {model.label}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>
      </div>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.stream_render_selected_only_description")}
        disabled={!isCombinedLayout}
        disabledLabel={polyglot.t("settings.disabled_label")}
        title={polyglot.t("settings.content.stream_render_selected_only_label")}
        disabledReason={polyglot.t("settings.only_available_in_layout", {
          layout: polyglot.t("appearance.layout_mode_stream"),
        })}
      >
        <Switch
          checked={settings.streamRenderSelectedOnly}
          disabled={!isCombinedLayout}
          onChange={(value) => updateSettings({ streamRenderSelectedOnly: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.title_alignment_description")}
        title={polyglot.t("appearance.title_alignment_label")}
      >
        <Select
          className="input-select"
          value={settings.titleAlignment}
          onChange={(value) => updateSettings({ titleAlignment: value })}
        >
          <Select.Option value="left">
            {polyglot.t("appearance.title_alignment_left") || "Left"}
          </Select.Option>
          <Select.Option value="center">
            {polyglot.t("appearance.title_alignment_center") || "Center"}
          </Select.Option>
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        title={
          polyglot.t("settings.content.article_font_size_label") ||
          polyglot.t("appearance.font_size_label")
        }
      >
        <InputNumber
          className="input-select"
          max={1.25}
          min={0.75}
          size="small"
          step={0.05}
          style={{ width: 120 }}
          suffix="rem"
          value={settings.fontSize}
          onChange={(value) => updateSettings({ fontSize: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem title={polyglot.t("appearance.article_width_label")}>
        <InputNumber
          className="input-select"
          max={100}
          min={50}
          size="small"
          step={2}
          style={{ width: 120 }}
          suffix="%"
          value={settings.articleWidth}
          onChange={(value) => updateSettings({ articleWidth: value })}
        />
      </SettingItem>
    </>
  )
}

export default Content
