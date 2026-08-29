import { useStore } from "@nanostores/react"
import { useId, useRef, useState } from "react"

import { polyglotState } from "@/hooks/useLanguage"

import "./ArticleEnclosures.css"

const AttachmentPreview = ({ item, name, onError, onImagePreview, polyglot }) => {
  const imageInstanceId = useId()
  const imageRef = useRef(null)

  return (
    <button
      aria-label={polyglot.t("article_attachments.preview_image", { name })}
      className="article-enclosure-preview"
      data-article-image-focus-index={item.galleryIndex}
      data-article-image-instance={imageInstanceId}
      type="button"
      onClick={() =>
        onImagePreview(item.galleryIndex, {
          targetElement: imageRef.current,
        })
      }
    >
      <img
        ref={imageRef}
        alt=""
        data-article-image-index={item.galleryIndex}
        data-article-image-instance={imageInstanceId}
        decoding="async"
        loading="lazy"
        src={item.url}
        onError={onError}
      />
    </button>
  )
}

const AttachmentName = ({ item, name }) => {
  if (item.linkMode === "blocked") {
    return (
      <span className="article-enclosure-link is-blocked" title={name}>
        {name}
      </span>
    )
  }

  const externalLinkProps =
    item.linkMode === "browser" ? { rel: "noopener noreferrer", target: "_blank" } : undefined

  return (
    <a className="article-enclosure-link" href={item.url} title={name} {...externalLinkProps}>
      {name}
    </a>
  )
}

const AttachmentMetadata = ({ item, polyglot }) => (
  <small className="article-enclosure-metadata">
    <span>{item.mime_type || polyglot.t("article_attachments.unknown_type")}</span>
    {item.formattedSize && (
      <>
        <span aria-hidden="true">·</span>
        <span>{item.formattedSize}</span>
      </>
    )}
    {item.linkMode === "blocked" && (
      <>
        <span aria-hidden="true">·</span>
        <span>{polyglot.t("article_attachments.unsupported_url")}</span>
      </>
    )}
  </small>
)

const ArticleEnclosures = ({ items, onImagePreview, onOpenChange, open }) => {
  const { polyglot } = useStore(polyglotState)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)
  const [failedPreviewIndexes, setFailedPreviewIndexes] = useState(() => new Set())

  const markPreviewAsFailed = (index) => {
    setFailedPreviewIndexes((currentIndexes) => new Set(currentIndexes).add(index))
  }

  if (items.length === 0) {
    return null
  }

  return (
    <details
      className="article-enclosures"
      open={open}
      onToggle={({ currentTarget }) => {
        if (currentTarget.open) {
          setHasBeenOpened(true)
        }
        onOpenChange(currentTarget.open)
      }}
    >
      <summary>{polyglot.t("article_attachments.title", { count: items.length })}</summary>
      {(open || hasBeenOpened) && (
        <ul className="article-enclosure-list">
          {items.map((item, index) => {
            const name =
              item.displayName ||
              polyglot.t("article_attachments.fallback_name", { index: index + 1 })
            const canShowPreview = item.canPreview && !failedPreviewIndexes.has(index)

            return (
              <li
                key={`${item.id ?? "attachment"}-${index}`}
                className={
                  canShowPreview ? "article-enclosure" : "article-enclosure without-preview"
                }
              >
                {canShowPreview && (
                  <AttachmentPreview
                    item={item}
                    name={name}
                    polyglot={polyglot}
                    onError={() => markPreviewAsFailed(index)}
                    onImagePreview={onImagePreview}
                  />
                )}
                <div className="article-enclosure-info">
                  <AttachmentName item={item} name={name} />
                  <AttachmentMetadata item={item} polyglot={polyglot} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </details>
  )
}

export default ArticleEnclosures
