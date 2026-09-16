import { Divider, Typography } from "@arco-design/web-react"
import { Children, Fragment, useId } from "react"

import "./SettingSection.css"

const SettingSection = ({ title, children }) => {
  const titleId = `${useId()}-title`
  const settingItems = Children.toArray(children)

  return (
    <section aria-labelledby={titleId} className="setting-section">
      <Typography.Title className="setting-section-title" heading={5} id={titleId}>
        {title}
      </Typography.Title>
      <div className="setting-section-items">
        {settingItems.map((settingItem, index) => (
          <Fragment key={settingItem.key ?? index}>
            {index > 0 && <Divider />}
            {settingItem}
          </Fragment>
        ))}
      </div>
    </section>
  )
}

export default SettingSection
