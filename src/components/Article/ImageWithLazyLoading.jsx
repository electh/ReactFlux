import { Skeleton } from "@arco-design/web-react";
import { useEffect, useRef, useState } from "react";

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
          image.onload = () => {
            setLoaded(true);
          };
          image.src = src;
          observer.unobserve(imgRef.current);
        }
      }
    });

    observer.observe(imgRef.current);

    // 在清理函数中使用局部变量保存 imgRef.current 的值
    const currentImgRef = imgRef.current;
    return () => {
      if (currentImgRef) {
        observer.unobserve(currentImgRef);
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
          <Skeleton
            text={{ rows: 0 }}
            image={{
              style: {
                width: width,
                height: height,
                margin: "0",
                borderRadius: borderRadius,
              },
            }}
            animation={true}
          />
        </div>
      )}
      <img
        className={status !== "unread" ? "read" : ""}
        src={loaded ? src : ""}
        alt={alt}
        style={{
          display: loaded ? "block" : "none",
          width: width,
          height: height,
          objectFit: "cover",
          borderRadius: borderRadius,
        }}
      />
    </div>
  );
};

export default ImageWithLazyLoading;
