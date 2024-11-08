import { useEffect, useState } from "react";

const MEDIUM_THRESHOLD = 768;
const LARGE_THRESHOLD = 992;

export const useScreenWidth = () => {
  const [isBelowMedium, setIsBelowMedium] = useState(
    window.innerWidth <= MEDIUM_THRESHOLD,
  );
  const [isBelowLarge, setIsBelowLarge] = useState(
    window.innerWidth <= LARGE_THRESHOLD,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsBelowMedium(window.innerWidth <= MEDIUM_THRESHOLD);
      setIsBelowLarge(window.innerWidth <= LARGE_THRESHOLD);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isBelowMedium, isBelowLarge };
};
