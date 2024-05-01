import { Skeleton } from "@arco-design/web-react";
import { useEffect, useState } from "react";
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
  const { ref, inView, entry } = useInView();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (inView && !isLoaded) {
      const image = new Image();
      image.onload = () => setIsLoaded(true);
      image.onerror = () => {
        entry.target.style.display = "none";
      };
      image.src = src;
    }
  }, [inView, isLoaded, src]);

  return (
    <div className="image-container" ref={ref}>
      {isLoaded ? (
        <img
          className={status === "unread" ? "" : "read"}
          src={src}
          alt={alt}
          style={{
            width,
            height,
            objectFit: "cover",
            borderRadius,
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
  );
};

export default ImageWithLazyLoading;
