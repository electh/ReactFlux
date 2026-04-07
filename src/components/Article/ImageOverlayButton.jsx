import { Tooltip } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import ImageLinkTag from "./ImageLinkTag"

import { settingsState } from "@/store/settingsState"
import { MIN_THUMBNAIL_SIZE } from "@/utils/constants"
import htmlAttributesToProps from "@/utils/html"
import { getCachedImageMetadata, preloadImageMetadata } from "@/utils/images"

import "./ImageOverlayButton.css"

const getReservedDimensions = (imgNode, metadata) => {
  const widthFromNode = Number.parseInt(imgNode.attribs.width, 10)
  const heightFromNode = Number.parseInt(imgNode.attribs.height, 10)

  const width = Number.isFinite(widthFromNode) ? widthFromNode : (metadata?.width ?? null)
  const height = Number.isFinite(heightFromNode) ? heightFromNode : (metadata?.height ?? null)

  if (!width || !height) {
    return null
  }

  return { width, height }
}

const ImageComponent = ({ imgNode, isIcon, isBigImage, index, metadata, togglePhotoSlider }) => {
  const { fontSize } = useStore(settingsState)
  const altText = imgNode.attribs.alt
  const imageProps = htmlAttributesToProps(imgNode.attribs, "img")
  const reservedDimensions = getReservedDimensions(imgNode, metadata)
  const imageStyle = {
    ...imageProps.style,
    ...(isBigImage
      ? {
          height: "auto",
          width: "100%",
        }
      : {}),
  }
  const reservedProps = reservedDimensions
    ? {
        height: reservedDimensions.height,
        width: reservedDimensions.width,
      }
    : {}

  return isIcon ? (
    <Tooltip content={altText} disabled={!altText}>
      <img
        {...imageProps}
        {...reservedProps}
        alt={altText}
        className="icon-image"
        style={{
          height: `${fontSize}rem`,
        }}
      />
    </Tooltip>
  ) : (
    <div
      className="image-overlay-target"
      style={
        reservedDimensions && isBigImage
          ? {
              aspectRatio: `${reservedDimensions.width} / ${reservedDimensions.height}`,
            }
          : undefined
      }
    >
      <img
        {...imageProps}
        {...reservedProps}
        alt={altText}
        className={isBigImage ? "big-image" : ""}
        style={imageStyle}
      />
      <Tooltip content={altText} disabled={!altText}>
        <button
          className="image-overlay-button"
          type="button"
          onClick={(event) => {
            event.preventDefault()
            togglePhotoSlider(index)
          }}
        />
      </Tooltip>
    </div>
  )
}

const findImageNode = (node, isLinkWrapper) =>
  isLinkWrapper ? node.children.find((child) => child.type === "tag" && child.name === "img") : node

const getImagePresentation = (metadata) => {
  const isSmall = Math.max(metadata.width, metadata.height) <= MIN_THUMBNAIL_SIZE
  const isLarge = metadata.width > 768

  return {
    isBigImage: isLarge && !isSmall,
    isIcon: isSmall,
  }
}

const ImageOverlayButton = ({ node, index, togglePhotoSlider, isLinkWrapper = false }) => {
  const [isIcon, setIsIcon] = useState(false)
  const [isBigImage, setIsBigImage] = useState(false)
  const [metadata, setMetadata] = useState(() =>
    getReservedDimensions(findImageNode(node, isLinkWrapper)),
  )

  const imgNode = findImageNode(node, isLinkWrapper)

  useEffect(() => {
    let isSubscribed = true

    const imgNode = findImageNode(node, isLinkWrapper)
    const imgSrc = imgNode.attribs.src

    const applyMetadata = (metadata) => {
      setMetadata(metadata)
      const presentation = getImagePresentation(metadata)
      setIsIcon(presentation.isIcon)
      setIsBigImage(presentation.isBigImage)
    }

    const cachedMetadata = getCachedImageMetadata(imgSrc)
    if (cachedMetadata) {
      applyMetadata(cachedMetadata)
      return
    }

    const loadImageMetadata = async () => {
      const metadata = await preloadImageMetadata(imgSrc)

      if (isSubscribed && metadata) {
        applyMetadata(metadata)
      }
    }

    void loadImageMetadata()

    return () => {
      isSubscribed = false
    }
  }, [node, isLinkWrapper])

  if (isIcon) {
    return isLinkWrapper ? (
      <a {...htmlAttributesToProps(node.attribs, "a")}>
        <ImageComponent
          imgNode={imgNode}
          index={index}
          isBigImage={isBigImage}
          isIcon={isIcon}
          metadata={metadata}
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
        metadata={metadata}
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
              metadata={metadata}
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
            metadata={metadata}
            togglePhotoSlider={togglePhotoSlider}
          />
        )}
      </div>
    </div>
  )
}

export default ImageOverlayButton
