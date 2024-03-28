import React from "react";
import { Navigate } from "react-router-dom";

import { getAuth } from "../utils/auth";

const RouterProtect = ({ children }) => {
  const auth = getAuth();
  if (auth) {
    return <>{children}</>;
  }
  return <Navigate to={"/login"} />;
};

export default RouterProtect;
