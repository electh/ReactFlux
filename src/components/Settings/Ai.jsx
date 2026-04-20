import { Divider, Input, Select } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import SettingItem from "./SettingItem"

import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"
import { AI_PROVIDERS, fetchProviderModels } from "@/utils/ai"

const summaryLanguageOptions = [
  { label: "English", value: "en-CA" },
  { label: "Deutsch", value: "de-DE" },
  { label: "Español", value: "es-ES" },
  { label: "Français", value: "fr-FR" },
  { label: "简体中文", value: "zh-CN" },
  { label: "Ελληνικά", value: "el-GR" },
]

const Ai = () => {
  const { polyglot } = useStore(polyglotState)
  const settings = useStore(settingsState)

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
        description={polyglot.t("settings.content.ai_provider_description")}
        title={polyglot.t("settings.content.ai_provider_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
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

      <Divider />

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

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.ai_model_description")}
        title={polyglot.t("settings.content.ai_model_label")}
      >
        <Select
          className="input-select"
          disabled={isProviderNone || modelIds.length === 0}
          getPopupContainer={() => document.body}
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

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.ai_summary_language_description")}
        title={polyglot.t("settings.content.ai_summary_language_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          style={{ width: "30ch" }}
          value={settings.aiSummaryLanguage}
          onChange={(value) => updateSettings({ aiSummaryLanguage: value })}
        >
          {summaryLanguageOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.ai_summary_excluded_language_description")}
        title={polyglot.t("settings.content.ai_summary_excluded_language_label")}
      >
        <Select
          allowClear
          className="input-select"
          getPopupContainer={() => document.body}
          placeholder={polyglot.t("settings.content.ai_summary_excluded_language_none")}
          style={{ width: "30ch" }}
          value={settings.aiSummaryExcludedLanguage || undefined}
          onChange={(value) => updateSettings({ aiSummaryExcludedLanguage: value || "" })}
        >
          {summaryLanguageOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>
    </>
  )
}

export default Ai
