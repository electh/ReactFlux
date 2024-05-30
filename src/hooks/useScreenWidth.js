import { useEffect, useState } from "react";

export const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const belowMd = screenWidth <= 768;
  const belowLg = screenWidth <= 992;

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { screenWidth, belowMd, belowLg };
};
