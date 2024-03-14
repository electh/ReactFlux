import { Navigate } from "react-router-dom";

import { getAuth } from "../utils/Auth";

export default function RouterProtect({ children }) {
  const auth = getAuth();
  if (auth) {
    return <>{children}</>;
  } else {
    return <Navigate to={"/login"} />;
  }
}
