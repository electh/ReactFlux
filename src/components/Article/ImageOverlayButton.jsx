import { Tooltip } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useId, useRef, useState } from "react"

import ImageLinkTag from "./ImageLinkTag"

import { polyglotState } from "@/hooks/useLanguage"
import { settingsState } from "@/store/settingsState"
import { MIN_THUMBNAIL_SIZE } from "@/utils/constants"

import "./ImageOverlayButton.css"

const ImageComponent = ({ imgNode, isIcon, isBigImage, index, togglePhotoSlider }) => {
  const { fontSize } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const imageInstanceId = useId()
  const imageRef = useRef(null)
  const altText = imgNode.attribs.alt

  return isIcon ? (
    <Tooltip content={altText} disabled={!altText}>
      <img
        {...imgNode.attribs}
        ref={imageRef}
        alt={altText}
        className="icon-image"
        data-article-image-index={index}
        data-article-image-instance={imageInstanceId}
        style={{
          height: `${fontSize}rem`,
        }}
      />
    </Tooltip>
  ) : (
    <div style={{ position: "relative" }}>
      <img
        {...imgNode.attribs}
        ref={imageRef}
        alt={altText}
        className={isBigImage ? "big-image" : ""}
        data-article-image-index={index}
        data-article-image-instance={imageInstanceId}
      />
      <Tooltip content={altText} disabled={!altText}>
        <button
          aria-label={polyglot.t("article_images.preview_image")}
          className="image-overlay-button"
          data-article-image-focus-index={index}
          data-article-image-instance={imageInstanceId}
          type="button"
          onClick={(event) => {
            event.preventDefault()
            togglePhotoSlider(index, { targetElement: imageRef.current })
          }}
        />
      </Tooltip>
    </div>
  )
}

const findImageNode = (node, isLinkWrapper) =>
  isLinkWrapper ? node.children.find((child) => child.type === "tag" && child.name === "img") : node

const ImageOverlayButton = ({ node, index, togglePhotoSlider, isLinkWrapper = false }) => {
  const [isIcon, setIsIcon] = useState(false)
  const [isBigImage, setIsBigImage] = useState(false)

  const imgNode = findImageNode(node, isLinkWrapper)

  useEffect(() => {
    let isSubscribed = true

    const imgNode = findImageNode(node, isLinkWrapper)
    const imgSrc = imgNode.attribs.src
    const img = new Image()
    img.src = imgSrc

    const handleLoad = () => {
      if (isSubscribed) {
        const isSmall = Math.max(img.width, img.height) <= MIN_THUMBNAIL_SIZE
        const isLarge = img.width > 768

        setIsIcon(isSmall)
        setIsBigImage(isLarge && !isSmall)
      }
    }

    img.addEventListener("load", handleLoad)

    return () => {
      isSubscribed = false
      img.src = ""
      img.removeEventListener("load", handleLoad)
    }
  }, [node, isLinkWrapper])

  if (isIcon) {
    return isLinkWrapper ? (
      <a {...node.attribs}>
        <ImageComponent
          imgNode={imgNode}
          index={index}
          isBigImage={isBigImage}
          isIcon={isIcon}
          togglePhotoSlider={togglePhotoSlider}
        />
        {node.children[1]?.data}
      </a>
    ) : (
      <ImageComponent
        imgNode={imgNode}
        index={index}
        isBigImage={isBigImage}
        isIcon={isIcon}
        togglePhotoSlider={togglePhotoSlider}
      />
    )
  }

  return (
    <div className="image-wrapper">
      <div className="image-container">
        {isLinkWrapper ? (
          <div>
            <ImageComponent
              imgNode={imgNode}
              index={index}
              isBigImage={isBigImage}
              isIcon={isIcon}
              togglePhotoSlider={togglePhotoSlider}
            />
            <ImageLinkTag href={node.attribs.href} />
          </div>
        ) : (
          <ImageComponent
            imgNode={imgNode}
            index={index}
            isBigImage={isBigImage}
            isIcon={isIcon}
            togglePhotoSlider={togglePhotoSlider}
          />
        )}
      </div>
    </div>
  )
}

export default ImageOverlayButton
