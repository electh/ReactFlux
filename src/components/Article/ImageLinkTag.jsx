import { Tag, Tooltip } from "@arco-design/web-react"
import { IconLink } from "@arco-design/web-react/icon"

import "./ImageLinkTag.css"

const ImageLinkTag = ({ href }) => {
  if (href === "#") {
    return null
  }

  return (
    <Tooltip content={href}>
      <Tag
        className="link-tag"
        icon={<IconLink />}
        onClick={(e) => {
          e.stopPropagation()
          window.open(href, "_blank")
        }}
      >
        {href}
      </Tag>
    </Tooltip>
  )
}

export default ImageLinkTag
