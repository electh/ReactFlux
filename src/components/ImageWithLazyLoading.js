import React, { useState, useEffect, useRef } from "react";
import { Skeleton, Spin } from "@arco-design/web-react";
import "./ImageWithLazyLoading.css";
const ImageWithLazyLoading = ({ src, alt, width, height, status }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = new Image();
          image.onload = () => {
            setLoaded(true);
          };
          image.src = src;
          observer.unobserve(imgRef.current);
        }
      });
    });

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <div
      ref={imgRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* 在这里添加加载动画，可以是一个旋转的加载指示器、进度条等 */}
          <Skeleton
            text={{ rows: 0 }}
            image={{
              style: {
                width: 300,
                height: 160,
                margin: "0",
              },
            }}
            animation={true}
          />
        </div>
      )}
      <img
        className={status !== "unread" ? "read" : ""}
        ref={imgRef}
        src={loaded ? src : ""}
        alt={alt}
        style={{
          display: loaded ? "block" : "none",
          width: width,
          height: height,
          objectFit: "cover",
        }}
      />
    </div>
  );
};

export default ImageWithLazyLoading;
