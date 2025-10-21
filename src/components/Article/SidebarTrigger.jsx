import { Button, Drawer } from "@arco-design/web-react"
import { IconMenu } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { atom } from "nanostores"
import { useEffect } from "react"
import { useLocation } from "react-router"

import Sidebar from "@/components/Sidebar/Sidebar"
import useScreenWidth from "@/hooks/useScreenWidth"
import "./SidebarTrigger.css"
import createSetter from "@/utils/nanostores"

const sidebarVisibleState = atom(false)
const setSidebarVisible = createSetter(sidebarVisibleState)

export default function SidebarTrigger() {
  const currentPath = useLocation().pathname
  const { isBelowLarge } = useScreenWidth()

  const sidebarVisible = useStore(sidebarVisibleState)

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
