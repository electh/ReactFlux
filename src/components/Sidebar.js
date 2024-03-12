import { IconApps, IconFile, IconList } from "@arco-design/web-react/icon";
import { Layout, Menu, Skeleton, Typography } from "@arco-design/web-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../Store";

const MenuItem = Menu.Item;
const { Sider } = Layout;
const { SubMenu } = Menu;

export default function Sidebar({ location }) {
  const navigate = useNavigate();
  const { collapsed, setCollapsed, feeds, groups, loading } = useStore();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const path = location.pathname;

  useEffect(() => {
    setSelectedKeys([location.pathname]);
  }, [location]);

  return (
    <Sider
      className="sidebar"
      trigger={null}
      breakpoint="lg"
      onCollapse={setCollapsed}
      collapsed={collapsed}
      collapsible
      style={{
        height: "calc(100% - 49px)",
        borderRight: "1px solid var(--color-border-2)",
        position: "fixed",
        top: "49px",
        zIndex: "999",
      }}
    >
      <Menu
        selectedKeys={selectedKeys}
        style={{ width: 200, height: "100%" }}
        onCollapseChange={() => setCollapsed(!collapsed)}
        collapse={collapsed}
        hasCollapseButton
        defaultOpenKeys={[
          path.substring(1).indexOf("/") === -1
            ? "/"
            : path.substring(0, path.substring(1).indexOf("/") + 1),
        ]}
        defaultSelectedKeys={[path]}
      >
        <SubMenu
          key={`/`}
          title={
            <>
              <IconList />
              <span style={{ fontWeight: 500 }}>ARTICLES</span>
            </>
          }
        >
          <Skeleton loading={loading} animation text={{ rows: 3 }}>
            <Menu.Item key={`/`} onClick={() => navigate("/")}>
              <span>ALL</span>
            </Menu.Item>
          </Skeleton>
          <Skeleton loading={loading} text={{ rows: 0 }}>
            <Menu.Item key={`/starred`} onClick={() => navigate("/starred")}>
              <span>STARRED</span>
            </Menu.Item>
          </Skeleton>
          <Skeleton loading={loading} text={{ rows: 0 }}>
            <Menu.Item key={"/history"} onClick={() => navigate("/history")}>
              <span>HISTORY</span>
            </Menu.Item>
          </Skeleton>
        </SubMenu>
        {/*{collapsed ? null : <Divider style={{ margin: "4px" }} />}*/}
        <SubMenu
          key={`/group`}
          title={
            <>
              <IconApps />
              <span style={{ fontWeight: 500 }}>GROUPS</span>
            </>
          }
        >
          <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
          {loading
            ? null
            : groups.map((group) => (
                <MenuItem
                  key={`/group/${group.id}`}
                  onClick={() => navigate(`/group/${group.id}`)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography.Ellipsis
                      expandable={false}
                      showTooltip={true}
                      style={{ width: group.unread !== 0 ? "80%" : "100%" }}
                    >
                      {group.title.toUpperCase()}
                    </Typography.Ellipsis>
                    <Typography.Ellipsis
                      expandable={false}
                      showTooltip={true}
                      style={{
                        width: "20%",
                        color: "var(--color-text-4)",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {group.unread === 0 ? "" : group.unread}
                    </Typography.Ellipsis>
                  </div>
                </MenuItem>
              ))}
        </SubMenu>
        {/*{collapsed ? null : <Divider style={{ margin: "4px" }} />}*/}
        <SubMenu
          key={`/feed`}
          title={
            <>
              <IconFile />
              <span style={{ fontWeight: 500 }}>FEEDS</span>
            </>
          }
        >
          <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
          {!loading && feeds.length > 0
            ? feeds.map((feed) => (
                <MenuItem
                  key={`/feed/${feed.id}`}
                  onClick={() => navigate(`/feed/${feed.id}`)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography.Ellipsis
                      expandable={false}
                      showTooltip={true}
                      style={{
                        width: feed.unread !== 0 ? "80%" : "100%",
                      }}
                    >
                      {feed.title.toUpperCase()}{" "}
                    </Typography.Ellipsis>
                    <Typography.Ellipsis
                      expandable={false}
                      showTooltip={true}
                      style={{
                        width: "20%",
                        color: "var(--color-text-4)",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {feed.unread === 0 ? "" : feed.unread}
                    </Typography.Ellipsis>
                  </div>
                </MenuItem>
              ))
            : null}
        </SubMenu>
      </Menu>
    </Sider>
  );
}
