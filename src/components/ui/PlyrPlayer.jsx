import { useStore } from "@nanostores/react"
import { useEffect, useRef, useState } from "react"

import { saveEnclosureProgression } from "@/apis"
import { authState } from "@/store/authState"
import "plyr/dist/plyr.css"
import "./PlyrPlayer.css"

const NOOP = () => {}
const DEFAULT_PLYR_OPTIONS = {}
// Preserve the latest position when an entry is reopened before its API payload refreshes.
const progressionCache = new Map()

const MEDIA_TYPES = {
  HLS: "hls",
  VIDEO: "video",
  AUDIO: "audio",
}

const MIME_TYPES = {
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  webm: "video/webm",
  ogv: "video/ogg",
  m3u8: "application/x-mpegURL",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
}

const DEFAULT_CONTROLS = [
  "play-large",
  "rewind",
  "play",
  "fast-forward",
  "progress",
  "current-time",
  "mute",
  "volume",
  "captions",
  "settings",
  "pip",
  "airplay",
  "fullscreen",
]

const normalizeMimeType = (mimeType) => {
  if (!mimeType) {
    return ""
  }
  return mimeType.toLowerCase() === "video/m4v" ? "video/x-m4v" : mimeType
}

const getMimeType = (src, sourceType) => {
  if (sourceType) {
    return normalizeMimeType(sourceType)
  }
  if (!src) {
    return ""
  }

  const sourceWithoutQuery = src.split(/[?#]/, 1)[0]
  const extension = sourceWithoutQuery.split(".").at(-1)?.toLowerCase()
  return MIME_TYPES[extension] || ""
}

const getMediaType = (src, sourceType, elementType) => {
  const mimeType = getMimeType(src, sourceType).toLowerCase()

  if (mimeType.includes("mpegurl")) {
    return MEDIA_TYPES.HLS
  }
  if (mimeType.startsWith("video/")) {
    return MEDIA_TYPES.VIDEO
  }
  if (mimeType.startsWith("audio/")) {
    return MEDIA_TYPES.AUDIO
  }

  return elementType === "audio" ? MEDIA_TYPES.AUDIO : MEDIA_TYPES.VIDEO
}

const initHls = async (mediaElement, src, onError) => {
  const { default: Hls } = await import("hls.js")

  if (!Hls.isSupported()) {
    if (mediaElement.canPlayType("application/vnd.apple.mpegurl")) {
      mediaElement.src = src
      return null
    }
    throw new Error("HLS is not supported in this browser.")
  }

  const hls = new Hls()
  hls.loadSource(src)
  hls.attachMedia(mediaElement)
  hls.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
      onError({ type: "hls", event, data })
    }
  })

  return hls
}

const PlyrPlayer = ({
  src,
  sourceType,
  elementType = "video",
  plyrOptions = DEFAULT_PLYR_OPTIONS,
  poster = "",
  style = {},
  enclosure = null,
  onPlayerInit = NOOP,
  onError = NOOP,
}) => {
  const { server } = useStore(authState)
  const mediaRef = useRef(null)
  const playerRef = useRef(null)
  const hlsRef = useRef(null)
  const lastSavedTimeRef = useRef(0)

  const enclosureId = enclosure?.id
  const progressionCacheKey = enclosureId
    ? `${server}:${enclosure?.user_id ?? ""}:${enclosureId}`
    : ""
  const serverProgression = Number(enclosure?.media_progression) || 0
  const [initialProgression] = useState(
    () => progressionCache.get(progressionCacheKey) ?? serverProgression,
  )
  const resolvedSourceType = sourceType || enclosure?.mime_type || ""
  const mediaType = getMediaType(src, resolvedSourceType, elementType)
  const resolvedElementType = mediaType === MEDIA_TYPES.AUDIO ? "audio" : "video"
  const canSaveProgression = Boolean(enclosureId)

  useEffect(() => {
    const mediaElement = mediaRef.current
    if (!src || !mediaElement) {
      return
    }

    let isCancelled = false

    const handleMediaError = () => {
      onError({ type: "media", error: mediaElement.error })
    }
    mediaElement.addEventListener("error", handleMediaError)

    const initPlayer = async () => {
      try {
        const { default: Plyr } = await import("plyr")
        if (isCancelled) {
          return
        }

        const player = new Plyr(mediaElement, {
          controls: DEFAULT_CONTROLS,
          loadSprite: true,
          ...plyrOptions,
        })
        playerRef.current = player
        lastSavedTimeRef.current = initialProgression

        if (canSaveProgression) {
          const restoreProgression = () => {
            if (initialProgression > 0) {
              player.currentTime = initialProgression
            }
          }

          const saveProgression = () => {
            const currentTime = Math.floor(player.currentTime)
            if (!Number.isFinite(currentTime) || currentTime === lastSavedTimeRef.current) {
              return
            }

            lastSavedTimeRef.current = currentTime
            progressionCache.set(progressionCacheKey, currentTime)
            saveEnclosureProgression(enclosureId, currentTime).catch((error) => {
              console.error("Failed to save enclosure progression:", error)
            })
          }

          player.on("loadedmetadata", restoreProgression)
          if (mediaElement.readyState >= 1) {
            restoreProgression()
          }
          player.on("timeupdate", () => {
            if (Math.abs(player.currentTime - lastSavedTimeRef.current) >= 10) {
              saveProgression()
            }
          })
          player.on("pause", saveProgression)
          player.on("ended", saveProgression)
        }

        if (mediaType === MEDIA_TYPES.HLS) {
          const hls = await initHls(mediaElement, src, onError)
          if (isCancelled) {
            hls?.destroy()
            return
          }
          hlsRef.current = hls
        } else {
          mediaElement.src = src
        }

        onPlayerInit(player)
      } catch (error) {
        onError({ type: "init", error })
      }
    }

    initPlayer()

    return () => {
      isCancelled = true
      mediaElement.removeEventListener("error", handleMediaError)
      playerRef.current?.destroy()
      hlsRef.current?.destroy()
      playerRef.current = null
      hlsRef.current = null
    }
  }, [
    canSaveProgression,
    enclosureId,
    initialProgression,
    mediaType,
    onError,
    onPlayerInit,
    plyrOptions,
    progressionCacheKey,
    src,
  ])

  const MediaElement = resolvedElementType
  const mediaProps = {
    ref: mediaRef,
    className: "plyr-react plyr",
    controls: true,
    preload: "metadata",
    ...(resolvedElementType === "video" && poster ? { poster } : {}),
  }
  const mimeType = getMimeType(src, resolvedSourceType)
  const sourceProps = {
    src,
    ...(mimeType ? { type: mimeType } : {}),
  }

  return (
    <div style={{ ...style, margin: "0 auto" }}>
      <MediaElement {...mediaProps}>
        <source {...sourceProps} />
      </MediaElement>
    </div>
  )
}

export default PlyrPlayer
