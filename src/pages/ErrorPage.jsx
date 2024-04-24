import { Button, Result } from "@arco-design/web-react";
import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div id="error-page" style={{ top: "30%", position: "relative" }}>
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
  );
};

export default ErrorPage;
