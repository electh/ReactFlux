import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/login/Login";
import RouterProtect from "./RouterProtect";

const router = createBrowserRouter([
  {
    index: true,
    element: (
      <RouterProtect>
        <App />
      </RouterProtect>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

export { router };
