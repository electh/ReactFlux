import { forwardRef, useState } from "react"
import { Link } from "react-router"

const CustomLink = forwardRef(function CustomLink(
  {
    url,
    text,
    onMouseEnter = (e) => e.target.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true })),
    onMouseLeave = (e) => e.target.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true })),
  },
  ref,
) {
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseEnter = (e) => {
    setIsHovering(true)
    onMouseEnter(e)
  }

  const handleMouseLeave = (e) => {
    setIsHovering(false)
    onMouseLeave(e)
  }

  return (
    <Link
      ref={ref}
      to={url}
      style={{
        color: "inherit",
        textDecoration: isHovering ? "underline" : "none",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </Link>
  )
})

export default CustomLink
