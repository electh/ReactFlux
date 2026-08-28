import { Tooltip } from "@arco-design/web-react"
import { IconLink } from "@arco-design/web-react/icon"

import "./ImageLinkTag.css"

const ImageLinkTag = ({ href }) => {
  if (href === "#") {
    return null
  }

  return (
    <Tooltip content={href}>
      <a
        className="link-tag"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        onClick={(event) => event.stopPropagation()}
      >
        <IconLink aria-hidden="true" className="link-tag-icon" />
        <span className="link-tag-text">{href}</span>
      </a>
    </Tooltip>
  )
}

export default ImageLinkTag
