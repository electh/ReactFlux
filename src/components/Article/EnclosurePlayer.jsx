import { useStore } from "@nanostores/react"
import { useCallback, useState } from "react"

import PlyrPlayer from "@/components/ui/PlyrPlayer"
import { polyglotState } from "@/hooks/useLanguage"

const EnclosurePlayer = ({ enclosure, poster }) => {
  const { polyglot } = useStore(polyglotState)
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => setHasError(true), [])

  return (
    <div className="enclosure-player">
      <PlyrPlayer
        enclosure={enclosure}
        poster={poster}
        src={enclosure.url}
        style={{ maxWidth: enclosure.kind === "video" ? "100%" : "400px" }}
        onError={handleError}
      />
      {hasError && (
        <p className="enclosure-player-error" role="status">
          {polyglot.t("article_attachments.media_error")}
        </p>
      )}
    </div>
  )
}

export default EnclosurePlayer
