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

export default function Login() {
  const [loginForm] = useForm();
  return (
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
        }}
      >
        <IconBook
          style={{
            fontSize: 48,
            color: "rgb(var(--primary-6))",
            marginTop: "48px",
          }}
        />
        <Typography.Title heading={3}>Connect to your server</Typography.Title>
        <Card
          style={{
            boxShadow: "0 4px 10px rgb(var(--gray-3))",
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
            onSubmit={() => Message.success("submit")}
          >
            <Form.Item
              label="Server address"
              field="server"
              rules={[{ required: true }]}
            >
              <Input
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
                prefix={<IconLock />}
                placeholder="please input api token"
              />
            </Form.Item>
          </Form>
          <Divider style={{ margin: 0 }} />
          <Button
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
  );
}
