import { Typography } from "@arco-design/web-react"
import { useId, useLayoutEffect, useRef } from "react"

import "./SettingItem.css"

const SettingItem = ({ title, description, children }) => {
  const generatedId = useId()
  const controlRef = useRef(null)
  const titleId = `${generatedId}-title`
  const descriptionId = `${generatedId}-description`

  useLayoutEffect(() => {
    const controls = controlRef.current.querySelectorAll(
      '[role="combobox"], [role="slider"], [role="switch"]',
    )

    for (const control of controls) {
      if (!control.hasAttribute("aria-label") && !control.hasAttribute("aria-labelledby")) {
        control.setAttribute("aria-labelledby", titleId)
      }
      if (!control.hasAttribute("aria-describedby")) {
        control.setAttribute("aria-describedby", descriptionId)
      }
    }
  }, [descriptionId, titleId])

  return (
    <section className="setting-row">
      <header className="setting-row-header">
        <Typography.Title heading={6} id={titleId} style={{ marginTop: 0 }}>
          {title}
        </Typography.Title>
        <Typography.Text id={descriptionId} type="secondary">
          {description}
        </Typography.Text>
      </header>
      <div ref={controlRef} className="setting-control">
        {children}
      </div>
    </section>
  )
}

export default SettingItem
