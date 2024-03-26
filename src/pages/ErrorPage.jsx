import { Button, Result } from "@arco-design/web-react";
import React from "react";
import { useNavigate, useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();
  const error = useRouteError();
  console.error(error);

  return (
    <div id="error-page" style={{ top: "30%", position: "relative" }}>
      <div>
        <Result
          status="404"
          subTitle="Whoops, that page is gone. "
          extra={[
            <Button key="back" type="primary" onClick={() => navigate("/")}>
              Back to Home
            </Button>,
          ]}
        />
      </div>
    </div>
  );
};

export default ErrorPage;
