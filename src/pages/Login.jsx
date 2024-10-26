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
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useStore } from "@nanostores/react";
import useLanguage, { polyglotState } from "../hooks/useLanguage";
import useTheme from "../hooks/useTheme";
import { authState, setAuth } from "../store/authState";
import { settingsState } from "../store/settingsState";
import { isValidAuth } from "../utils/auth";
import {
  handleEnterKeyToSubmit,
  validateAndFormatFormFields,
} from "../utils/form";
import { hideSpinner } from "../utils/loading";
import "./Login.css";

const Login = () => {
  useLanguage();
  useTheme();

  const auth = useStore(authState);
  const { homePage } = useStore(settingsState);
  const { polyglot } = useStore(polyglotState);

  const [loginForm] = useForm();
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState("token");
  /* token or user */
  const location = useLocation();
  const navigate = useNavigate();

  const performHealthCheck = async (auth) => {
    setLoading(true);
    const { server, token, username, password } = auth;
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
        const from = location.state?.from || `/${homePage}`;
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
    setLoading(false);
  };

  const handleLogin = async (auth) => {
    if (!isValidAuth(auth)) {
      Message.error(polyglot.t("login.auth_error"));
      return;
    }
    await performHealthCheck(auth);
  };

  useEffect(() => {
    hideSpinner();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const url = new URL(window.location.href);
    const { server, token, username, password } = Object.fromEntries(
      url.searchParams,
    );
    if (server) {
      if (username) {
        setAuthMethod("user");
      }
      loginForm.setFieldsValue({ server, token, username, password });
      loginForm.submit();
    }
  }, [polyglot]);

  if (isValidAuth(auth)) {
    return <Navigate to={`/${homePage}`} />;
  }

  return (
    polyglot && (
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
                  history.replaceState(null, "", "/login");
                  await handleLogin(loginForm.getFieldsValue());
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
            <Divider>{polyglot.t("login.another_login_method")}</Divider>
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
    )
  );
};

export default Login;
