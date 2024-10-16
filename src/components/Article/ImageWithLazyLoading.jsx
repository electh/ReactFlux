import { Skeleton } from "@arco-design/web-react";
import { animated, useSpring } from "@react-spring/web";
import { useState } from "react";
import { useInView } from "react-intersection-observer";

import "./ImageWithLazyLoading.css";

const ImageWithLazyLoading = ({
  alt,
  borderRadius,
  height,
  src,
  status,
  width,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const { opacity } = useSpring({
    opacity: isLoaded ? 1 : 0,
    config: { duration: 200 },
  });

  const { ref } = useInView({
    triggerOnce: true,
    onChange: (inView, entry) => {
      if (inView && !isLoaded) {
        const image = new Image();
        image.onload = () => setIsLoaded(true);
        image.onerror = () => {
          entry.target.style.display = "none";
        };
        image.src = src;
      }
    },
  });

  return (
    <div className="image-container" ref={ref}>
      <div
        className="img-placeholder"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "var(--color-fill-2)",
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        {isLoaded ? (
          <animated.img
            className={status === "unread" ? "" : "read"}
            src={src}
            alt={alt}
            style={{
              width,
              height,
              objectFit: "cover",
              borderRadius,
              opacity,
            }}
          />
        ) : (
          <div className="skeleton-container">
            <Skeleton
              text={{ rows: 0 }}
              image={{
                style: {
                  width,
                  height,
                  margin: "0",
                  borderRadius,
                },
              }}
              animation
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageWithLazyLoading;
