import { Tooltip } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { attributesToProps } from "html-react-parser"
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
  const imageProps = attributesToProps(imgNode.attribs, "img")
  const imageClassName = classNames(imageProps.className, {
    "big-image": isBigImage && !isIcon,
    "icon-image": isIcon,
  })

  return isIcon ? (
    <Tooltip content={altText} disabled={!altText}>
      <img
        {...imageProps}
        ref={imageRef}
        alt={altText}
        className={imageClassName}
        data-article-image-index={index}
        data-article-image-instance={imageInstanceId}
        style={{
          ...imageProps.style,
          height: `${fontSize}rem`,
        }}
      />
    </Tooltip>
  ) : (
    <div style={{ position: "relative" }}>
      <img
        {...imageProps}
        ref={imageRef}
        alt={altText}
        className={imageClassName}
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

    const image = new Image()
    image.src = imgNode.attribs.src

    const handleLoad = () => {
      if (!isSubscribed) {
        return
      }

      const isSmall = Math.max(image.width, image.height) <= MIN_THUMBNAIL_SIZE
      const isLarge = image.width > 768

      setIsIcon(isSmall)
      setIsBigImage(isLarge && !isSmall)
    }

    image.addEventListener("load", handleLoad)

    return () => {
      isSubscribed = false
      image.src = ""
      image.removeEventListener("load", handleLoad)
    }
  }, [imgNode])

  if (isIcon) {
    return isLinkWrapper ? (
      <a {...attributesToProps(node.attribs, "a")}>
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
