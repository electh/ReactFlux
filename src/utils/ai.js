export const AI_PROVIDERS = {
  NONE: "none",
  ANTHROPIC: "anthropic",
  GEMINI: "gemini",
  PERPLEXITY: "perplexity",
  OLLAMA: "ollama",
  LM_STUDIO: "lmstudio",
}

const normalizeGeminiModel = (model) => model?.replace(/^models\//, "")

const parseJsonSafely = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const parseErrorMessage = (data, fallback) => {
  if (!data) {
    return fallback
  }
  return data?.error?.message || data?.message || fallback
}

const normalizeBaseUrl = (value) => (value || "").trim().replace(/\/+$/, "")

const buildOllamaUrl = (baseUrl, path) => {
  const base = normalizeBaseUrl(baseUrl)
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${base}${suffix}`
}

const buildLmStudioUrl = (baseUrl, path) => {
  const base = normalizeBaseUrl(baseUrl)
  const suffix = path.startsWith("/") ? path : `/${path}`
  if (base.endsWith("/v1")) {
    return `${base}${suffix}`
  }
  return `${base}/v1${suffix}`
}

export const fetchProviderModels = async (provider, apiKey) => {
  if (!apiKey) {
    return []
  }

  if (provider === AI_PROVIDERS.ANTHROPIC) {
    const fallbackModels = [
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
      { id: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    ]
    const response = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    })
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      return fallbackModels
    }
    const parsedModels = (data?.models || [])
      .map((model) => {
        const id = model?.id
        if (!id) {
          return null
        }
        const label = model?.display_name || model?.name || id
        return { id, label }
      })
      .filter(Boolean)
    return parsedModels.length > 0 ? parsedModels : fallbackModels
  }

  if (provider === AI_PROVIDERS.GEMINI) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    )
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return (data?.models || [])
      .filter((model) => (model?.supportedGenerationMethods || []).includes("generateContent"))
      .map((model) => {
        const id = normalizeGeminiModel(model?.name)
        const label = model?.displayName?.trim() || id
        return id
          ? {
              id,
              label,
            }
          : null
      })
      .filter(Boolean)
      .filter(({ id }) => id.includes("gemini") && !id.includes("embedding"))
  }

  if (provider === AI_PROVIDERS.PERPLEXITY) {
    const fallbackModels = [
      { id: "sonar", label: "Sonar" },
      { id: "sonar-pro", label: "Sonar Pro" },
      { id: "sonar-reasoning", label: "Sonar Reasoning" },
    ]
    try {
      const response = await fetch("https://api.perplexity.ai/models", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      })
      const data = await parseJsonSafely(response)
      if (!response.ok) {
        return fallbackModels
      }
      const models = data?.data || data?.models || data?.result || []
      const parsedModels = models
        .map((model) => {
          if (typeof model === "string") {
            return { id: model, label: model }
          }
          const id = model?.id || model?.name
          if (!id) {
            return null
          }
          return {
            id,
            label: model?.display_name || model?.name || id,
          }
        })
        .filter(Boolean)
      return parsedModels.length > 0 ? parsedModels : fallbackModels
    } catch {
      return fallbackModels
    }
  }

  if (provider === AI_PROVIDERS.OLLAMA) {
    const response = await fetch(buildOllamaUrl(apiKey, "/api/tags"))
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return (data?.models || [])
      .map((model) => {
        const id = model?.name || model?.model
        if (!id) {
          return null
        }
        return { id, label: id }
      })
      .filter(Boolean)
  }

  if (provider === AI_PROVIDERS.LM_STUDIO) {
    const response = await fetch(buildLmStudioUrl(apiKey, "/models"))
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return (data?.data || [])
      .map((model) => {
        const id = model?.id || model?.name
        if (!id) {
          return null
        }
        return { id, label: id }
      })
      .filter(Boolean)
  }

  return []
}

const LANGUAGE_NAMES = {
  "en-CA": "English",
  "de-DE": "German",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "zh-CN": "Simplified Chinese",
  "el-GR": "Greek",
}

const getLanguageName = (code) => LANGUAGE_NAMES[code] || code

const buildSummaryPrompt = (title, content, { targetLanguage, excludedLanguage } = {}) => {
  const trimmedTitle = title?.trim()
  const titleLine = trimmedTitle ? `Title: ${trimmedTitle}\n` : ""
  const targetName = getLanguageName(targetLanguage || "en-CA")
  let languageInstruction = `Write the summary in ${targetName}.`
  if (excludedLanguage) {
    const excludedName = getLanguageName(excludedLanguage)
    languageInstruction += ` However, if the article is written in ${excludedName}, keep the summary in ${excludedName} instead of translating it.`
  }
  return (
    "Summarize the following article in 5-7 concise bullet points. " +
    "Focus on key facts and outcomes. " +
    `${languageInstruction}\n\n` +
    `${titleLine}Content:\n${content}`
  )
}

const extractAnthropicText = (data) => {
  const segments = data?.content || []
  return segments
    .map((segment) => segment?.text)
    .filter(Boolean)
    .join("\n")
}

const extractGeminiText = (data) => {
  const parts = data?.candidates?.[0]?.content?.parts || []
  return parts
    .map((part) => part?.text)
    .filter(Boolean)
    .join("\n")
}

const extractPerplexityText = (data) => data?.choices?.[0]?.message?.content || ""

const extractOllamaText = (data) => data?.response || data?.message?.content || ""

const extractLmStudioText = (data) => data?.choices?.[0]?.message?.content || ""

export const summarizeWithProvider = async ({
  provider,
  apiKey,
  model,
  title,
  content,
  targetLanguage,
  excludedLanguage,
}) => {
  const promptOptions = { targetLanguage, excludedLanguage }
  if (provider === AI_PROVIDERS.ANTHROPIC) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        messages: [{ role: "user", content: buildSummaryPrompt(title, content, promptOptions) }],
      }),
    })
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return extractAnthropicText(data)
  }

  if (provider === AI_PROVIDERS.GEMINI) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: buildSummaryPrompt(title, content, promptOptions) }],
            },
          ],
          generationConfig: { maxOutputTokens: 1800 },
        }),
      },
    )
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return extractGeminiText(data)
  }

  if (provider === AI_PROVIDERS.PERPLEXITY) {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: buildSummaryPrompt(title, content, promptOptions) },
        ],
      }),
    })
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return extractPerplexityText(data)
  }

  if (provider === AI_PROVIDERS.OLLAMA) {
    const response = await fetch(buildOllamaUrl(apiKey, "/api/generate"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: buildSummaryPrompt(title, content, promptOptions),
        stream: false,
      }),
    })
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return extractOllamaText(data)
  }

  if (provider === AI_PROVIDERS.LM_STUDIO) {
    const response = await fetch(buildLmStudioUrl(apiKey, "/chat/completions"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: buildSummaryPrompt(title, content, promptOptions) },
        ],
      }),
    })
    const data = await parseJsonSafely(response)
    if (!response.ok) {
      throw new Error(parseErrorMessage(data, response.statusText))
    }
    return extractLmStudioText(data)
  }

  throw new Error("unsupported_provider")
}

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const applyInlineMarkdown = (escaped) =>
  escaped
    .replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replaceAll(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replaceAll(/`([^`]+)`/g, "<code>$1</code>")

const renderInline = (text) => applyInlineMarkdown(escapeHtml(text))

const buildListFromLines = (lines) =>
  `<ul>${lines.map((line) => `<li>${renderInline(line)}</li>`).join("")}</ul>`

const buildParagraphs = (text) =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replaceAll("\n", " ").trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${renderInline(paragraph)}</p>`)
    .join("")

export const formatSummaryHtml = (summaryText, heading) => {
  const normalized = summaryText.trim()
  if (!normalized) {
    return ""
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.replace(/^[•\-*]\s?/, "").trim())
    .filter(Boolean)

  const isList = lines.length > 1
  const bodyHtml = isList ? buildListFromLines(lines) : buildParagraphs(normalized)
  return `<section class="ai-summary"><h2>${escapeHtml(heading)}</h2>${bodyHtml}</section>`
}
