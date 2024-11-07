import { useEffect, useState } from "react";

import { Tag } from "@arco-design/web-react";
import { IconLink } from "@arco-design/web-react/icon";
import { useStore } from "@nanostores/react";
import { settingsState } from "../../store/settingsState";

const ImageComponent = ({
  imgNode,
  isIcon,
  isBigImage,
  index,
  togglePhotoSlider,
}) => {
  const { fontSize } = useStore(settingsState);

  return isIcon ? (
    <img
      {...imgNode.attribs}
      className={"icon-image"}
      alt={imgNode.attribs.alt ?? "image"}
      style={{
        display: "inline-block",
        width: "auto",
        height: `${fontSize}rem`,
        margin: 0,
      }}
    />
  ) : (
    <div style={{ position: "relative" }}>
      <img
        {...imgNode.attribs}
        className={isBigImage ? "big-image" : ""}
        alt={imgNode.attribs.alt ?? "image"}
      />
      <button
        className={"image-overlay-button"}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "transparent",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "zoom-in",
          border: "none",
          zIndex: 1,
        }}
        type="button"
        onClick={(event) => {
          event.preventDefault();
          togglePhotoSlider(index);
        }}
      />
    </div>
  );
};

const ImageOverlayButton = ({
  node,
  index,
  togglePhotoSlider,
  isLinkWrapper = false,
}) => {
  const [isIcon, setIsIcon] = useState(false);
  const [isBigImage, setIsBigImage] = useState(false);
  useEffect(() => {
    const imgNode = isLinkWrapper ? node.children[0] : node;
    const imgSrc = imgNode.attribs.src;
    const img = new Image();
    img.src = imgSrc;

    img.onload = () => {
      const isSmall = img.width <= 100 && img.height <= 100;
      const isLarge = img.width > 768;

      setIsIcon(isSmall);
      setIsBigImage(isLarge && !isSmall);
    };
  }, [node, isLinkWrapper]);

  const imgNode = isLinkWrapper ? node.children[0] : node;

  if (isIcon) {
    return isLinkWrapper ? (
      <a {...node.attribs}>
        <ImageComponent
          imgNode={imgNode}
          isIcon={isIcon}
          isBigImage={isBigImage}
          index={index}
          togglePhotoSlider={togglePhotoSlider}
        />
        {node.children[1]?.data}
      </a>
    ) : (
      <ImageComponent
        imgNode={imgNode}
        isIcon={isIcon}
        isBigImage={isBigImage}
        index={index}
        togglePhotoSlider={togglePhotoSlider}
      />
    );
  }

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <div style={{ display: "inline-block", position: "relative" }}>
        {isLinkWrapper ? (
          <div>
            <a {...node.attribs}>
              <ImageComponent
                imgNode={imgNode}
                isIcon={isIcon}
                isBigImage={isBigImage}
                index={index}
                togglePhotoSlider={togglePhotoSlider}
              />
            </a>
            <Tag
              icon={<IconLink />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(node.attribs.href, "_blank");
              }}
              style={{
                cursor: "pointer",
                maxWidth: "50%",
              }}
            >
              {node.attribs.href}
            </Tag>
          </div>
        ) : (
          <ImageComponent
            imgNode={imgNode}
            isIcon={isIcon}
            isBigImage={isBigImage}
            index={index}
            togglePhotoSlider={togglePhotoSlider}
          />
        )}
      </div>
    </div>
  );
};

export default ImageOverlayButton;
