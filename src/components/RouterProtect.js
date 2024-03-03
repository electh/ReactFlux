import { Navigate } from "react-router-dom";

export default function RouterProtect({ children }) {
  const server = localStorage.getItem("server");
  const token = localStorage.getItem("token");
  if (server && token) {
    return <>{children}</>;
  } else {
    return <Navigate to={"/login"} />;
  }
}
