import {
  Avatar,
  Button,
  Dropdown,
  Menu,
  Message,
  Space,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import {
  IconBook,
  IconMoonFill,
  IconPlus,
  IconPoweroff,
  IconSettings,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import { useStore } from "../Store";

export default function Header({ theme }) {
  const navigate = useNavigate();
  const { toggleTheme, setVisible } = useStore();

  const handelLogout = () => {
    localStorage.removeItem("server");
    localStorage.removeItem("token");
    localStorage.removeItem("theme");
    document.body.removeAttribute("arco-theme");
    navigate("/login");
    Message.success("logout");
  };

  return (
    <div
      className="header"
      style={{
        borderBottom: "1px solid var(--color-border-2)",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        position: "fixed",
        width: "100%",
        height: "48px",
        zIndex: "999",
        backgroundColor: "var(--color-bg-1)",
      }}
    >
      <div
        className="brand"
        style={{ marginLeft: "20px", display: "flex", alignItems: "center" }}
      >
        <IconBook
          style={{
            fontSize: 32,
            color: "rgb(var(--primary-6))",
            marginRight: "5px",
          }}
        />
        <Typography.Title heading={5} style={{ margin: "0" }}>
          Reactflux
        </Typography.Title>
      </div>
      <div className="button-group" style={{ marginRight: "20px" }}>
        <Space size={16}>
          <Tooltip content="Add feed" mini>
            <Button
              shape="circle"
              size="small"
              type="primary"
              icon={<IconPlus />}
              onClick={() => setVisible("addFeed", true)}
            />
          </Tooltip>
          <Button
            shape="circle"
            size="small"
            icon={theme === "dark" ? <IconSunFill /> : <IconMoonFill />}
            onClick={toggleTheme}
          />
          <Dropdown
            droplist={
              <Menu>
                <Menu.Item key="0" onClick={() => setVisible("settings", true)}>
                  <IconSettings
                    style={{
                      marginRight: 8,
                      fontSize: 16,
                      transform: "translateY(1px)",
                    }}
                  />
                  Settings
                </Menu.Item>
                <Menu.Item key="1" onClick={handelLogout}>
                  <IconPoweroff
                    style={{
                      marginRight: 8,
                      fontSize: 16,
                      transform: "translateY(1px)",
                    }}
                  />
                  Logout
                </Menu.Item>
              </Menu>
            }
            trigger="click"
            position="br"
          >
            <Avatar size={28} style={{ cursor: "pointer" }}>
              <IconUser />
            </Avatar>
          </Dropdown>
        </Space>
      </div>
    </div>
  );
}
