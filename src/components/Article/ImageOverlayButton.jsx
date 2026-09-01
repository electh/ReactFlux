import { Tooltip } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { attributesToProps } from "html-react-parser"
import { useEffect, useId, useRef, useState } from "react"

import ImageLinkTag from "./ImageLinkTag"

import { polyglotState } from "@/hooks/useLanguage"
import usePhotoSlider from "@/hooks/usePhotoSlider"
import { articleFontSizeState } from "@/store/settingsState"
import { MIN_THUMBNAIL_SIZE } from "@/utils/constants"

import "./ImageOverlayButton.css"

const useImageTooltip = (isDisabled) => {
  const { isPhotoSliderVisible, photoSliderSessionId } = usePhotoSlider()
  const [visibleTooltipSessionId, setVisibleTooltipSessionId] = useState(null)
  const pointerTypeRef = useRef(null)
  const suppressUntilPointerLeaveRef = useRef(false)
  const tooltipTriggerRef = useRef(null)
  const wasPhotoSliderVisibleRef = useRef(isPhotoSliderVisible)
  const isTooltipAvailable = !isDisabled && !isPhotoSliderVisible

  useEffect(() => {
    if (isPhotoSliderVisible) {
      suppressUntilPointerLeaveRef.current = true
    } else if (wasPhotoSliderVisibleRef.current && !tooltipTriggerRef.current?.matches(":hover")) {
      suppressUntilPointerLeaveRef.current = false
    }

    wasPhotoSliderVisibleRef.current = isPhotoSliderVisible
  }, [isPhotoSliderVisible])

  const dismissTooltip = () => {
    suppressUntilPointerLeaveRef.current = true
    setVisibleTooltipSessionId(null)
  }

  const handlePointerDown = ({ pointerType }) => {
    pointerTypeRef.current = pointerType
    dismissTooltip()
  }

  const handlePointerCancel = () => {
    pointerTypeRef.current = null
    setVisibleTooltipSessionId(null)

    if (!isPhotoSliderVisible) {
      suppressUntilPointerLeaveRef.current = false
    }
  }

  const handlePointerEnter = ({ pointerType }) => {
    pointerTypeRef.current = pointerType
  }

  const handlePointerLeave = () => {
    pointerTypeRef.current = null

    if (!isPhotoSliderVisible) {
      suppressUntilPointerLeaveRef.current = false
    }
  }

  const handleVisibleChange = (isVisible) => {
    const shouldShowTooltip =
      isVisible &&
      isTooltipAvailable &&
      pointerTypeRef.current === "mouse" &&
      !suppressUntilPointerLeaveRef.current

    setVisibleTooltipSessionId(shouldShowTooltip ? photoSliderSessionId : null)
  }

  return {
    dismissTooltip,
    tooltipProps: {
      popupVisible: isTooltipAvailable && visibleTooltipSessionId === photoSliderSessionId,
      trigger: "hover",
      onVisibleChange: handleVisibleChange,
    },
    tooltipTriggerProps: {
      ref: tooltipTriggerRef,
      onPointerCancel: handlePointerCancel,
      onPointerDown: handlePointerDown,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    },
  }
}

const ImageComponent = ({ imgNode, isIcon, isBigImage, index, onImageLoad, togglePhotoSlider }) => {
  const fontSize = useStore(articleFontSizeState)
  const { polyglot } = useStore(polyglotState)
  const imageInstanceId = useId()
  const imageRef = useRef(null)
  const altText = imgNode.attribs.alt
  const { dismissTooltip, tooltipProps, tooltipTriggerProps } = useImageTooltip(!altText)
  const imageProps = attributesToProps(imgNode.attribs, "img")
  const imageClassName = classNames(imageProps.className, {
    "big-image": isBigImage && !isIcon,
    "icon-image": isIcon,
  })
  const optimizedImageProps = {
    ...imageProps,
    decoding: imageProps.decoding ?? "async",
    loading: imageProps.loading ?? "lazy",
  }

  return isIcon ? (
    <Tooltip content={altText} disabled={!altText} {...tooltipProps}>
      <img
        {...optimizedImageProps}
        {...tooltipTriggerProps}
        alt={altText}
        className={imageClassName}
        data-article-image-index={index}
        data-article-image-instance={imageInstanceId}
        style={{
          ...imageProps.style,
          height: `${fontSize}rem`,
        }}
        onLoad={onImageLoad}
      />
    </Tooltip>
  ) : (
    <div style={{ position: "relative" }}>
      <img
        {...optimizedImageProps}
        ref={imageRef}
        alt={altText}
        className={imageClassName}
        data-article-image-index={index}
        data-article-image-instance={imageInstanceId}
        onLoad={onImageLoad}
      />
      <Tooltip content={altText} disabled={!altText} {...tooltipProps}>
        <button
          {...tooltipTriggerProps}
          aria-label={polyglot.t("article_images.preview_image")}
          className="image-overlay-button"
          data-article-image-focus-index={index}
          data-article-image-instance={imageInstanceId}
          type="button"
          onClick={(event) => {
            event.preventDefault()
            dismissTooltip()
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

  const handleImageLoad = ({ currentTarget }) => {
    const { naturalHeight, naturalWidth } = currentTarget
    const isSmall = Math.max(naturalWidth, naturalHeight) <= MIN_THUMBNAIL_SIZE

    setIsIcon(isSmall)
    setIsBigImage(naturalWidth > 768 && !isSmall)
  }

  if (isIcon) {
    return isLinkWrapper ? (
      <a {...attributesToProps(node.attribs, "a")}>
        <ImageComponent
          imgNode={imgNode}
          index={index}
          isBigImage={isBigImage}
          isIcon={isIcon}
          togglePhotoSlider={togglePhotoSlider}
          onImageLoad={handleImageLoad}
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
        onImageLoad={handleImageLoad}
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
              onImageLoad={handleImageLoad}
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
            onImageLoad={handleImageLoad}
          />
        )}
      </div>
    </div>
  )
}

export default ImageOverlayButton
