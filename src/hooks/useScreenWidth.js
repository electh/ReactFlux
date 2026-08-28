import { useEffect, useState } from "react"

const COMPACT_THRESHOLD = 359
const MEDIUM_THRESHOLD = 768
const LARGE_THRESHOLD = 992

const useScreenWidth = () => {
  const [isBelowCompact, setIsBelowCompact] = useState(window.innerWidth <= COMPACT_THRESHOLD)
  const [isBelowMedium, setIsBelowMedium] = useState(window.innerWidth <= MEDIUM_THRESHOLD)
  const [isBelowLarge, setIsBelowLarge] = useState(window.innerWidth <= LARGE_THRESHOLD)

  useEffect(() => {
    const handleResize = () => {
      setIsBelowCompact(window.innerWidth <= COMPACT_THRESHOLD)
      setIsBelowMedium(window.innerWidth <= MEDIUM_THRESHOLD)
      setIsBelowLarge(window.innerWidth <= LARGE_THRESHOLD)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return { isBelowCompact, isBelowMedium, isBelowLarge }
}

export default useScreenWidth
