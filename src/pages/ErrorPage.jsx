import { Button, Result } from "@arco-design/web-react"
import { useEffect } from "react"
import { useNavigate, useRouteError } from "react-router"

import hideSpinner from "@/utils/loading"

const ErrorPage = () => {
  const navigate = useNavigate()
  const error = useRouteError()
  console.error(error)

  useEffect(() => {
    hideSpinner()
  }, [])

  return (
    <div id="error-page" style={{ top: "30%", position: "relative" }}>
      <Result
        status="404"
        subTitle={error.statusText || error.message}
        extra={[
          <Button key="back" type="primary" onClick={() => navigate("/")}>
            Back to Home
          </Button>,
        ]}
      />
    </div>
  )
}

export default ErrorPage
