import { IconBook, IconHome, IconLock } from "@arco-design/web-react/icon";
import {
  Input,
  Typography,
  Form,
  Button,
  Card,
  Message,
  Link,
  Divider,
} from "@arco-design/web-react";
import useForm from "@arco-design/web-react/es/Form/useForm";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [loginForm] = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.getItem("server") && localStorage.getItem("token")) {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const healthCheck = async () => {
    setLoading(true);
    try {
      const response = await axios({
        url: "/v1/me",
        method: "get",
        baseURL: loginForm.getFieldsValue().server,
        headers: { "X-Auth-Token": loginForm.getFieldsValue().token },
        timeout: 5000,
      });
      if (response.status === 200) {
        Message.success("Success");
        localStorage.setItem("server", loginForm.getFieldsValue().server);
        localStorage.setItem("token", loginForm.getFieldsValue().token);
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
    setLoading(false);
  };

  const handelLogin = () => {
    healthCheck();
  };

  return (
    <div style={{ backgroundColor: "var(--color-bg-1)", height: "100%" }}>
      <div
        style={{
          backgroundColor: "var(--color-fill-1)",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            overflowY: "auto",
          }}
        >
          <IconBook
            style={{
              fontSize: 48,
              color: "rgb(var(--primary-6))",
              marginTop: "48px",
            }}
          />
          <Typography.Title heading={3}>
            Connect to your server
          </Typography.Title>
          <Card
            style={{
              boxShadow: "0 4px 10px rgb(var(--color-bg-3))",
              padding: "20px",
              width: "380px",
              marginTop: "20px",
            }}
          >
            <Form
              form={loginForm}
              layout="vertical"
              autoComplete="off"
              onChange={(value, values) => console.log(value, values)}
              onSubmit={handelLogin}
            >
              <Form.Item
                label="Server address"
                field="server"
                rules={[{ required: true }]}
              >
                <Input
                  disabled={loading}
                  prefix={<IconHome />}
                  placeholder="please input server address"
                />
              </Form.Item>
              <Form.Item
                label="API Token"
                field="token"
                rules={[{ required: true }]}
              >
                <Input
                  disabled={loading}
                  prefix={<IconLock />}
                  placeholder="please input api token"
                />
              </Form.Item>
            </Form>
            <Divider style={{ margin: 0 }} />
            <Button
              loading={loading}
              type="primary"
              long={true}
              onClick={() => loginForm.submit()}
              style={{ marginTop: "20px" }}
            >
              Connect
            </Button>
          </Card>
          <div style={{ display: "flex", marginTop: "40px" }}>
            <Typography.Text disabled>Need more information?</Typography.Text>
            <Link
              href={"https://miniflux.app/docs/api.html#authentication"}
              style={{ fontWeight: "500" }}
            >
              Go to Miniflux official website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
