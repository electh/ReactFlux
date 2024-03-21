import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  Link,
  Message,
  Typography,
} from "@arco-design/web-react";
import useForm from "@arco-design/web-react/es/Form/useForm";
import {
  IconBook,
  IconHome,
  IconLock,
  IconUser,
} from "@arco-design/web-react/icon";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAuth, setAuth } from "../utils/Auth";

const Login = () => {
  const [loginForm] = useForm();
  const [loading, setLoading] = useState(false);
  /* token or user */
  const [method, setMethod] = useState(getAuth() || "token");
  const navigate = useNavigate();
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (getAuth()) {
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
        auth: {
          username: loginForm.getFieldsValue().username,
          password: loginForm.getFieldsValue().password,
        },
        timeout: 5000,
      });
      if (response.status === 200) {
        Message.success("Success");
        setAuth(method, loginForm.getFieldsValue());
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
    setLoading(false);
  };

  const handleLogin = () => {
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
              marginTop: "20px",
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
              // onChange={(value, values) => console.log(value, values)}
              onSubmit={handleLogin}
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
              {method === "token" ? (
                <Form.Item
                  label="API Token"
                  field="token"
                  rules={[{ required: true }]}
                >
                  <Input
                    disabled={loading}
                    prefix={<IconLock />}
                    placeholder="please input api token"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        loginForm.submit();
                      }
                    }}
                  />
                </Form.Item>
              ) : null}
              {method === "user" ? (
                <>
                  <Form.Item
                    label="Username"
                    field="username"
                    rules={[{ required: true }]}
                  >
                    <Input
                      disabled={loading}
                      prefix={<IconUser />}
                      placeholder="please input username"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Password"
                    field="password"
                    rules={[{ required: true }]}
                  >
                    <Input.Password
                      disabled={loading}
                      prefix={<IconLock />}
                      placeholder="please input password"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          loginForm.submit();
                        }
                      }}
                    />
                  </Form.Item>
                </>
              ) : null}
            </Form>
            <Button
              loading={loading}
              type="primary"
              long={true}
              onClick={() => loginForm.submit()}
              style={{ marginTop: "20px" }}
            >
              Connect
            </Button>
            <Divider orientation="center">Or connect with</Divider>
            <Button
              type="secondary"
              long={true}
              onClick={() => setMethod(method === "token" ? "user" : "token")}
              style={{ marginTop: "20px" }}
            >
              {method === "token" ? "Username and password" : "API Token"}
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
};

export default Login;
