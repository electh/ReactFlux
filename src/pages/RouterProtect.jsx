import { Navigate } from "react-router-dom";

import { useSnapshot } from "valtio";
import { authState } from "../store/authState";
import { isValidAuth } from "../utils/auth";

const RouterProtect = ({ children }) => {
  const auth = useSnapshot(authState);

  if (isValidAuth(auth)) {
    return <>{children}</>;
  }
  return <Navigate to={"/login"} />;
};

export default RouterProtect;
