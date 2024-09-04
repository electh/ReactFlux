import {
  Button,
  Divider,
  Form,
  Input,
  Link,
  Message,
  Typography,
} from "@arco-design/web-react";
import useForm from "@arco-design/web-react/es/Form/useForm";
import { IconHome, IconLock, IconUser } from "@arco-design/web-react/icon";
import { ofetch } from "ofetch";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import background from "./images/background.jpg";

import { useSetAtom } from "jotai";
import { authAtom } from "../atoms/authAtom";
import useTheme from "../hooks/useTheme";
import { isValidAuth } from "../utils/auth";
import {
  handleEnterKeyToSubmit,
  validateAndFormatFormFields,
} from "../utils/form";

const Login = () => {
  useTheme();
  const [loginForm] = useForm();
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState("token");
  /* token or user */
  const setAuth = useSetAtom(authAtom);
  const navigate = useNavigate();

  const performHealthCheck = async () => {
    setLoading(true);
    const { server, token, username, password } = loginForm.getFieldsValue();
    try {
      const response = await ofetch.raw("v1/me", {
        baseURL: server,
        headers: token
          ? { "X-Auth-Token": token }
          : { Authorization: `Basic ${btoa(`${username}:${password}`)}` },
      });
      if (response.status === 200) {
        Message.success("Login successfully");
        setAuth({ server, token, username, password });
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    const auth = loginForm.getFieldsValue();
    if (!isValidAuth(auth)) {
      Message.error("Please check your server address and credentials");
      return;
    }
    await performHealthCheck();
  };

  return (
    <div className="page-layout" style={{ height: "100%", display: "flex" }}>
      <div
        className="form-panel"
        style={{
          backgroundColor: "var(--color-bg-1)",
          width: "50%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflowY: "auto",
          zIndex: 2,
        }}
      >
        <div className="login-form" style={{ width: "340px" }}>
          <Typography.Title heading={3}>
            Connect to your server
          </Typography.Title>
          <Form
            autoComplete="off"
            form={loginForm}
            layout="vertical"
            onSubmit={async () => {
              if (validateAndFormatFormFields(loginForm)) {
                await handleLogin();
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
            {authMethod === "token" && (
              <Form.Item
                field="token"
                label="API Token"
                rules={[{ required: true }]}
                onKeyDown={(event) => {
                  handleEnterKeyToSubmit(event, loginForm);
                }}
              >
                <Input.Password
                  disabled={loading}
                  placeholder="Please input API token"
                  prefix={<IconLock />}
                />
              </Form.Item>
            )}
            {authMethod === "user" && (
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
                    placeholder="Please input username"
                    prefix={<IconUser />}
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
                    placeholder="Please input password"
                    prefix={<IconLock />}
                  />
                </Form.Item>
              </>
            )}
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
            onClick={() =>
              setAuthMethod(authMethod === "token" ? "user" : "token")
            }
            style={{ marginTop: "20px" }}
          >
            {authMethod === "token" ? "Username and password" : "API Token"}
          </Button>
          <div style={{ display: "flex", marginTop: "40px" }}>
            <Typography.Text disabled>Need more info?</Typography.Text>
            <Link
              href={"https://miniflux.app/docs/api.html#authentication"}
              style={{ fontWeight: "500" }}
            >
              Go to Miniflux official website
            </Link>
          </div>
        </div>
      </div>
      <div
        className="background"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: "50%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default Login;
