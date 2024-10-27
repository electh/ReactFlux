import { useEffect, useState } from "react";

import { useStore } from "@nanostores/react";
import { useScreenWidth } from "../../hooks/useScreenWidth";
import { settingsState } from "../../store/settingsState";

const ImageComponent = ({ imgNode, isIcon }) => {
  const { fontSize } = useStore(settingsState);

  return (
    <img
      {...imgNode.attribs}
      alt={imgNode.attribs.alt ?? "image"}
      style={
        isIcon
          ? {
              display: "inline-block",
              width: "auto",
              height: `${fontSize}rem`,
              margin: 0,
            }
          : {}
      }
    />
  );
};

const ImageOverlayButton = ({
  node,
  index,
  togglePhotoSlider,
  isLinkWrapper = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isIcon, setIsIcon] = useState(false);
  const { isBelowMedium } = useScreenWidth();

  useEffect(() => {
    const imgNode = isLinkWrapper ? node.children[0] : node;
    const imgSrc = imgNode.attribs.src;
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => setIsIcon(img.width <= 100 && img.height <= 100);
  }, [node, isLinkWrapper]);

  const imgNode = isLinkWrapper ? node.children[0] : node;

  if (isIcon) {
    return isLinkWrapper ? (
      <a {...node.attribs}>
        <ImageComponent imgNode={imgNode} isIcon={isIcon} />
        {node.children[1]?.data}
      </a>
    ) : (
      <ImageComponent imgNode={imgNode} isIcon={isIcon} />
    );
  }

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <div
        style={{ display: "inline-block", position: "relative" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isLinkWrapper ? (
          <a {...node.attribs}>
            <ImageComponent imgNode={imgNode} isIcon={isIcon} />
          </a>
        ) : (
          <ImageComponent imgNode={imgNode} isIcon={isIcon} />
        )}
        <button
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
            opacity: isBelowMedium || isHovering ? 1 : 0,
            transition: "opacity 0.3s",
            cursor: "pointer",
            border: "none",
          }}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            togglePhotoSlider(index);
          }}
        />
      </div>
    </div>
  );
};

export default ImageOverlayButton;
