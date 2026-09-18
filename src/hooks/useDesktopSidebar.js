import { useContext } from "react"

import DesktopSidebarContext from "@/contexts/desktop-sidebar-context"

const useDesktopSidebar = () => {
  const desktopSidebar = useContext(DesktopSidebarContext)

  if (!desktopSidebar) {
    throw new Error("useDesktopSidebar must be used within DesktopSidebarContext.Provider")
  }

  return desktopSidebar
}

export default useDesktopSidebar
