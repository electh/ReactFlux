import { useEffect, useState } from "react";

export const useScreenWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  const isBelowMedium = width <= 768;
  const isBelowLarge = width <= 992;

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { width, isBelowMedium, isBelowLarge };
};
