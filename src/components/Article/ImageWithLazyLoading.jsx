import { Skeleton } from "@arco-design/web-react";
import React, { useEffect, useRef, useState } from "react";

import "./ImageWithLazyLoading.css";

const ImageWithLazyLoading = ({
  src,
  alt,
  width,
  height,
  status,
  borderRadius,
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const image = new Image();
          image.onload = () => setLoaded(true);
          image.src = src;
          if (imgRef.current) {
            observer.unobserve(imgRef.current);
          }
        }
      }
    });

    const currentImgRef = imgRef.current;
    if (currentImgRef) {
      observer.observe(currentImgRef);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div className="image-container" ref={imgRef}>
      {!loaded && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
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
            animation={true}
          />
        </div>
      )}
      {loaded && (
        <img
          className={status !== "unread" ? "read" : ""}
          src={src}
          alt={alt}
          style={{
            width,
            height,
            objectFit: "cover",
            borderRadius,
          }}
        />
      )}
    </div>
  );
};

export default ImageWithLazyLoading;
