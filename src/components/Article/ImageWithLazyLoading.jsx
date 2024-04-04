import { Skeleton } from "@arco-design/web-react";
import React, { useEffect, useRef, useState } from "react";

import "./ImageWithLazyLoading.css";

const ImageWithLazyLoading = ({
  alt,
  borderRadius,
  height,
  src,
  status,
  width,
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const image = new Image();
          image.onload = () => setLoaded(true);
          image.onerror = () => {
            if (imgRef.current) {
              observer.unobserve(imgRef.current);
              imgRef.current.parentElement.style.display = "none";
            }
          };
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
