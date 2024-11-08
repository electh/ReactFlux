import { useEffect, useState } from "react";

export const useScreenWidth = () => {
  const mediumThreshold = 768;
  const largeThreshold = 992;
  const [isBelowMedium, setIsBelowMedium] = useState(
    window.innerWidth <= mediumThreshold,
  );
  const [isBelowLarge, setIsBelowLarge] = useState(
    window.innerWidth <= largeThreshold,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsBelowMedium(window.innerWidth <= mediumThreshold);
      setIsBelowLarge(window.innerWidth <= largeThreshold);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isBelowMedium, isBelowLarge };
};
