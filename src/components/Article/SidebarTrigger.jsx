import { Button, Drawer } from "@arco-design/web-react"
import { IconMenu } from "@arco-design/web-react/icon"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

import Sidebar from "@/components/Sidebar/Sidebar"
import useScreenWidth from "@/hooks/useScreenWidth"
import "./SidebarTrigger.css"

export default function SidebarTrigger() {
  const currentPath = useLocation().pathname
  const { isBelowLarge } = useScreenWidth()

  const [sidebarVisible, setSidebarVisible] = useState(false)

  useEffect(() => {
    if (!isBelowLarge) {
      setSidebarVisible(false)
    }
  }, [isBelowLarge])

  useEffect(() => {
    if (currentPath) {
      setSidebarVisible(false)
    }
  }, [currentPath])

  return (
    <div>
      <div className="brand">
        <Button
          className="trigger"
          shape="circle"
          size="small"
          onClick={() => setSidebarVisible(!sidebarVisible)}
        >
          <IconMenu />
        </Button>
      </div>
      <Drawer
        className="sidebar-drawer"
        closable={false}
        footer={null}
        placement="left"
        title={null}
        visible={sidebarVisible}
        width={240}
        onCancel={() => setSidebarVisible(false)}
      >
        <Sidebar />
      </Drawer>
    </div>
  )
}
