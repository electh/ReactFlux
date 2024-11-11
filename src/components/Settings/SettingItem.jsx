import { Typography } from "@arco-design/web-react"

import "./SettingItem.css"

const SettingItem = ({ title, description, children }) => (
  <section className="setting-row">
    <header>
      <Typography.Title heading={6} style={{ marginTop: 0 }}>
        {title}
      </Typography.Title>
      <Typography.Text type="secondary">{description}</Typography.Text>
    </header>
    {children}
  </section>
)

export default SettingItem
