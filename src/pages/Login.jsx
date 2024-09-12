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

import { useStore } from "@nanostores/react";
import useLanguage, { polyglotState } from "../hooks/useLanguage";
import useTheme from "../hooks/useTheme";
import { setAuth } from "../store/authState";
import { isValidAuth } from "../utils/auth";
import {
  handleEnterKeyToSubmit,
  validateAndFormatFormFields,
} from "../utils/form";
import "./Login.css";

const Login = () => {
  useLanguage();
  useTheme();

  const { polyglot } = useStore(polyglotState);

  const [loginForm] = useForm();
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState("token");
  /* token or user */
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
        Message.success(polyglot.t("login.success"));
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
      Message.error(polyglot.t("login.auth_error"));
      return;
    }
    await performHealthCheck();
  };

  if (!polyglot) {
    return null;
  }

  return (
    <div className="page-layout">
      <div className="form-panel">
        <div className="login-form">
          <Typography.Title heading={3}>
            {polyglot.t("login.login_to_your_server")}
          </Typography.Title>
          <Form
            autoComplete="off"
            form={loginForm}
            layout="vertical"
            onSubmit={async () => {
              if (validateAndFormatFormFields(loginForm)) {
                await handleLogin();
              } else {
                Message.error(polyglot.t("login.submit_error"));
              }
            }}
          >
            <Form.Item
              field="server"
              label={polyglot.t("login.server_label")}
              rules={[{ required: true }]}
              onKeyDown={(event) => {
                handleEnterKeyToSubmit(event, loginForm);
              }}
            >
              <Input
                disabled={loading}
                placeholder={polyglot.t("login.server_placeholder")}
                prefix={<IconHome />}
              />
            </Form.Item>
            {authMethod === "token" && (
              <Form.Item
                field="token"
                label={polyglot.t("login.token_label")}
                rules={[{ required: true }]}
                onKeyDown={(event) => {
                  handleEnterKeyToSubmit(event, loginForm);
                }}
              >
                <Input.Password
                  disabled={loading}
                  placeholder={polyglot.t("login.token_placeholder")}
                  prefix={<IconLock />}
                />
              </Form.Item>
            )}
            {authMethod === "user" && (
              <>
                <Form.Item
                  field="username"
                  label={polyglot.t("login.username_label")}
                  rules={[{ required: true }]}
                  onKeyDown={(event) => {
                    handleEnterKeyToSubmit(event, loginForm);
                  }}
                >
                  <Input
                    disabled={loading}
                    placeholder={polyglot.t("login.username_placeholder")}
                    prefix={<IconUser />}
                  />
                </Form.Item>
                <Form.Item
                  field="password"
                  label={polyglot.t("login.password_label")}
                  rules={[{ required: true }]}
                  onKeyDown={(event) => {
                    handleEnterKeyToSubmit(event, loginForm);
                  }}
                >
                  <Input.Password
                    disabled={loading}
                    placeholder={polyglot.t("login.password_placeholder")}
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
            {polyglot.t("login.login_button")}
          </Button>
          <Divider orientation="center">
            {polyglot.t("login.another_login_method")}
          </Divider>
          <Button
            type="secondary"
            long={true}
            onClick={() =>
              setAuthMethod(authMethod === "token" ? "user" : "token")
            }
            style={{ marginTop: "20px" }}
          >
            {authMethod === "token"
              ? polyglot.t("login.another_login_button")
              : polyglot.t("login.token_label")}
          </Button>
          <div style={{ display: "flex", marginTop: "40px" }}>
            <Typography.Text disabled>
              {polyglot.t("login.need_help")}
            </Typography.Text>
            <Link
              href={"https://miniflux.app/docs/api.html#authentication"}
              style={{ fontWeight: "500" }}
            >
              {polyglot.t("login.miniflux_official_website")}
            </Link>
          </div>
        </div>
      </div>
      <div className="background" />
    </div>
  );
};

export default Login;
