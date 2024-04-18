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

import { useAtom } from "jotai";
import { authAtom } from "../atoms/authAtom";
import { isValidAuth } from "../utils/auth";
import {
  handleEnterKeyToSubmit,
  validateAndFormatFormFields,
} from "../utils/form";

const Login = () => {
  const [loginForm] = useForm();
  const [loading, setLoading] = useState(false);
  /* token or user */
  const [auth, setAuth] = useAtom(authAtom);
  const [method, setMethod] = useState("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (isValidAuth(auth)) {
      navigate("/");
    }
  }, [auth, navigate]);

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
        setAuth(loginForm.getFieldsValue());
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
              autoComplete="off"
              form={loginForm}
              layout="vertical"
              onSubmit={() => {
                if (validateAndFormatFormFields(loginForm)) {
                  handleLogin();
                } else {
                  Message.error("Please fill in all required fields");
                }
              }}
            >
              <Form.Item
                field="server"
                label="Server address"
                rules={[{ required: true }]}
                onKeyDown={(event) => {
                  handleEnterKeyToSubmit(event, loginForm);
                }}
              >
                <Input
                  disabled={loading}
                  placeholder="Please input server address"
                  prefix={<IconHome />}
                />
              </Form.Item>
              {method === "token" && (
                <Form.Item
                  field="token"
                  label="API Token"
                  rules={[{ required: true }]}
                  onKeyDown={(event) => {
                    handleEnterKeyToSubmit(event, loginForm);
                  }}
                >
                  <Input
                    disabled={loading}
                    placeholder="Please input api token"
                    prefix={<IconLock />}
                  />
                </Form.Item>
              )}
              {method === "user" && (
                <>
                  <Form.Item
                    field="username"
                    label="Username"
                    rules={[{ required: true }]}
                    onKeyDown={(event) => {
                      handleEnterKeyToSubmit(event, loginForm);
                    }}
                  >
                    <Input
                      disabled={loading}
                      prefix={<IconUser />}
                      placeholder="Please input username"
                    />
                  </Form.Item>
                  <Form.Item
                    field="password"
                    label="Password"
                    rules={[{ required: true }]}
                    onKeyDown={(event) => {
                      handleEnterKeyToSubmit(event, loginForm);
                    }}
                  >
                    <Input.Password
                      disabled={loading}
                      prefix={<IconLock />}
                      placeholder="Please input password"
                    />
                  </Form.Item>
                </>
              )}
            </Form>
            <Button
              loading={loading}
              type="primary"
              long={true}
              onClick={handleLogin}
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
