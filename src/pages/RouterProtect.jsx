import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useStore } from "@nanostores/react";
import { authState } from "../store/authState";
import { isValidAuth } from "../utils/auth";

const RouterProtect = () => {
  const auth = useStore(authState);
  const location = useLocation();

  if (isValidAuth(auth)) {
    return <Outlet />;
  }
  return <Navigate to={"/login"} state={{ from: location.pathname }} replace />;
};

export default RouterProtect;
