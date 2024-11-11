import { useStore } from "@nanostores/react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { authState } from "@/store/authState"
import isValidAuth from "@/utils/auth"

const RouterProtect = () => {
  const auth = useStore(authState)
  const location = useLocation()

  if (isValidAuth(auth)) {
    return <Outlet />
  }
  return <Navigate replace state={{ from: location.pathname }} to={"/login"} />
}

export default RouterProtect
