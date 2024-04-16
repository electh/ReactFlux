import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { isValidAuth } from "../utils/auth";

const RouterProtect = ({ children }) => {
  const [auth] = useAuth();
  if (isValidAuth(auth)) {
    return <>{children}</>;
  }
  return <Navigate to={"/login"} />;
};

export default RouterProtect;
