import { Navigate } from "react-router-dom";
import { authAtom } from "../atoms/authAtom";

import { useAtomValue } from "jotai";
import { isValidAuth } from "../utils/auth";

const RouterProtect = ({ children }) => {
  const auth = useAtomValue(authAtom);

  if (isValidAuth(auth)) {
    return <>{children}</>;
  }
  return <Navigate to={"/login"} />;
};

export default RouterProtect;
