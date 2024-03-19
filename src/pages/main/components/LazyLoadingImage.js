import { useEffect, useRef, useState } from "react";

import "./LazyLoadingImage.css";
import { Skeleton } from "@arco-design/web-react";

const LazyLoadingImage = ({
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

    // 在清理函数中使用局部变量保存 imgRef.current 的值
    const currentImgRef = imgRef.current;
    return () => {
      if (currentImgRef) {
        observer.unobserve(currentImgRef);
      }
    };
  }, [src]);

  return (
    <div ref={imgRef}>
      <Skeleton
        loading={!loaded}
        animation
        text={{ rows: 0 }}
        image={{
          style: {
            width: width,
            height: height,
          },
        }}
      >
        <img
          className={status === "read" ? "read" : "unread"}
          src={src}
          alt={alt}
          style={{
            width: width,
            height: height,
            objectFit: "cover",
            borderRadius: borderRadius,
          }}
        />
      </Skeleton>
    </div>
  );
};

export default LazyLoadingImage;
