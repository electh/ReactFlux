import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import { contentState } from "@/store/contentState"
import "plyr/dist/plyr.css"
import "./PlyrPlayer.css"

const PlyrPromise = import("plyr")

const MEDIA_TYPES = {
  HLS: "hls",
  VIDEO: "video",
  AUDIO: "audio",
}

const MIME_TYPES = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  m3u8: "application/x-mpegURL",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
}

const DEFAULT_CONTROLS = [
  "play-large",
  "play",
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

const getMimeType = (src, sourceType) => {
  if (sourceType) {
    return sourceType
  }

  if (!src) {
    return ""
  }

  const extension = src.split(".").pop()?.toLowerCase()
  return MIME_TYPES[extension] || ""
}

const getMediaType = (src, sourceType, elementType) => {
  const mimeType = sourceType || getMimeType(src, sourceType)

  if (mimeType.includes("mpegURL") || mimeType.includes("mpegurl")) {
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

const initHls = async (mediaRef, src, onError) => {
  const { default: Hls } = await import("hls.js")

  if (!Hls.isSupported()) {
    if (mediaRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      mediaRef.current.src = src
      return true
    }
    throw new Error("HLS is not supported in this browser.")
  }

  const hls = new Hls()
  hls.loadSource(src)
  hls.attachMedia(mediaRef.current)
  hls.on(Hls.Events.ERROR, (event, data) => {
    onError({ type: "hls", event, data })
  })

  return hls
}

const PlyrPlayer = ({
  src,
  sourceType = undefined,
  elementType = "video",
  plyrOptions = {},
  poster = "",
  onPlayerInit = () => {},
  onError = () => {},
}) => {
  const { activeContent } = useStore(contentState)

  const mediaRef = useRef(null)
  const playerRef = useRef(null)
  const hlsRef = useRef(null)

  useEffect(() => {
    if (!src || !activeContent) {
      return
    }

    const initPlayer = async () => {
      try {
        const mediaType = getMediaType(src, sourceType, elementType)

        const { default: Plyr } = await PlyrPromise

        playerRef.current = new Plyr(mediaRef.current, {
          controls: DEFAULT_CONTROLS,
          loadSprite: true,
          ...plyrOptions,
        })

        if (mediaType === MEDIA_TYPES.HLS) {
          hlsRef.current = await initHls(mediaRef, src, onError)
        } else {
          mediaRef.current.src = src
        }

        onPlayerInit(playerRef.current)
      } catch (error) {
        onError({ type: "init", error })
      }
    }

    initPlayer()

    return () => {
      if (!activeContent) {
        playerRef.current?.destroy()
        hlsRef.current?.destroy()
        playerRef.current = null
        hlsRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  const renderMedia = () => {
    const mediaProps = {
      ref: mediaRef,
      className: "plyr-react plyr",
      poster: poster,
    }

    const sourceProps = {
      src,
      type: getMimeType(src, sourceType),
    }

    return elementType === "audio" ? (
      <audio {...mediaProps}>
        <source {...sourceProps} />
      </audio>
    ) : (
      <video {...mediaProps}>
        <source {...sourceProps} />
      </video>
    )
  }

  return renderMedia()
}

export default PlyrPlayer
