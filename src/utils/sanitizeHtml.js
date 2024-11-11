import sanitize from "sanitize-html"

const getSanitizeOptions = () => ({
  allowedTags: sanitize.defaults.allowedTags.concat(["img", "iframe", "video", "source"]),
  allowedAttributes: {
    ...sanitize.defaults.allowedAttributes,
    img: ["alt", "class", "height", "loading", "src", "srcset", "style", "title", "width"],
    iframe: [
      {
        name: "sandbox",
        multiple: true,
        values: [
          "allow-popups",
          "allow-same-origin",
          "allow-scripts",
          "allow-popups-to-escape-sandbox",
        ],
      },
      "width",
      "height",
      "frameborder",
      "allowfullscreen",
      "loading",
      "src",
    ],
    video: [
      "autoplay",
      "controls",
      "height",
      "loop",
      "muted",
      "playsinline",
      "poster",
      "preload",
      "src",
      "type",
      "width",
    ],
    source: ["src", "type"],
    // used by littlefoot
    a: ["href", "name", "target", "rel", "referrerpolicy"],
    sup: ["id"],
    li: ["id"],
  },
  allowedSchemes: ["http", "https", "data", "mailto"],
  allowedIframeHostnames: [
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "player.bilibili.com",
    "player.vimeo.com",
  ],
})

const sanitizeHtml = (content) => {
  const sanitizeOptions = getSanitizeOptions()
  return sanitize(content, sanitizeOptions)
}

export default sanitizeHtml
