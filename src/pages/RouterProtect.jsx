import { Navigate } from "react-router-dom";

import { useStore } from "@nanostores/react";
import { authState } from "../store/authState";
import { isValidAuth } from "../utils/auth";

const RouterProtect = ({ children }) => {
  const auth = useStore(authState);

  if (isValidAuth(auth)) {
    return <>{children}</>;
  }
  return <Navigate to={"/login"} />;
};

export default RouterProtect;
