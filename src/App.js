import _ from "lodash";
import { create } from "zustand";
import "./App.css";
import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  Message,
  Modal,
  Select,
  Skeleton,
  Space,
  Switch,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import {
  IconApps,
  IconBook,
  IconFile,
  IconList,
  IconMoonFill,
  IconPlus,
  IconPoweroff,
  IconSettings,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { addFeed, getFeeds, getGroups, getUnreadInfo } from "./apis";
import Settings from "./components/Settings";

const MenuItem = Menu.Item;
const { SubMenu } = Menu;
const { Sider } = Layout;

const useStore = create((set) => ({
  feeds: [],
  groups: [],
  loading: true,
  initData: async () => {
    set({ loading: true });
    const feedResponse = await getFeeds();
    const groupResponse = await getGroups();
    const unreadResponse = await getUnreadInfo();

    if (feedResponse && unreadResponse && groupResponse) {
      const unreadInfo = unreadResponse.data.unreads;
      const feedsWithUnread = feedResponse.data.map((feed) => ({
        ...feed,
        unread: unreadInfo[feed.id] || 0,
      }));

      const groupsWithUnread = groupResponse.data.map((group) => {
        let unreadCount = 0;
        let feedCount = 0;

        feedsWithUnread.forEach((feed) => {
          if (feed.category.id === group.id) {
            unreadCount += feed.unread;
            feedCount += 1;
          }
        });

        return {
          ...group,
          unread: unreadCount,
          feed: feedCount,
        };
      });

      set({ feeds: _.orderBy(feedsWithUnread, ["title"], ["asc"]) });
      set({ groups: _.orderBy(groupsWithUnread, ["title"], ["asc"]) });
      set({ loading: false });
    }
  },

  updateFeedUnread: (feedId, status) => {
    set((state) => {
      const updatedFeeds = state.feeds.map((feed) =>
        feed.id === feedId
          ? {
              ...feed,
              unread:
                status === "read"
                  ? Math.max(0, feed.unread - 1)
                  : feed.unread + 1,
            }
          : feed,
      );
      return { feeds: updatedFeeds };
    });
  },

  updateGroupUnread: (groupId, status) => {
    set((state) => {
      const updatedGroups = state.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              unread:
                status === "read"
                  ? Math.max(0, group.unread - 1)
                  : group.unread + 1,
            }
          : group,
      );
      return { groups: updatedGroups };
    });
  },
}));

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [visible, setVisible] = useState(false);
  const feeds = useStore((state) => state.feeds);
  const groups = useStore((state) => state.groups);
  const loading = useStore((state) => state.loading);
  const initData = useStore((state) => state.initData);
  const [feedModalVisible, setFeedModalVisible] = useState(false);
  const [feedModalLoading, setFeedModalLoading] = useState(false);
  const [feedForm] = Form.useForm();
  const path = location.pathname;

  useEffect(() => {
    setSelectedKeys([location.pathname]);
  }, [location]);

  useEffect(() => {
    console.log(path);
    console.log(
      path.substring(1).indexOf("/") === -1
        ? path
        : path.substring(0, path.substring(1).indexOf("/") + 1),
    );
  }, [path]);

  const initTheme = () => {
    if (theme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
    }
  };

  useEffect(() => {
    initData();
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handelToggle = () => {
    if (theme === "light") {
      document.body.setAttribute("arco-theme", "dark");
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
  };

  const handelCollapse = (collapse) => {
    setCollapsed(collapse);
  };

  const handelAddFeed = async (feed_url, group_id, is_full_text) => {
    setFeedModalLoading(true);
    const response = await addFeed(feed_url, group_id, is_full_text);
    if (response) {
      await initData();
      Message.success("Success");
      setFeedModalVisible(false);
    }
    setFeedModalLoading(false);
    feedForm.resetFields();
  };

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
      className="app"
      style={{ display: "flex", backgroundColor: "var(--color-bg-1)" }}
    >
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
            <Tooltip content="Add feed">
              <Button
                shape="circle"
                size="small"
                type="primary"
                icon={<IconPlus />}
                onClick={() => setFeedModalVisible(true)}
              />
            </Tooltip>
            <Tooltip
              content={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <Button
                shape="circle"
                size="small"
                icon={theme === "dark" ? <IconSunFill /> : <IconMoonFill />}
                onClick={() => handelToggle()}
              ></Button>
            </Tooltip>

            <Dropdown
              droplist={
                <Menu>
                  <Menu.Item key="0" onClick={() => setVisible(true)}>
                    <IconSettings
                      style={{
                        marginRight: 8,
                        fontSize: 16,
                        transform: "translateY(1px)",
                      }}
                    />
                    Settings
                  </Menu.Item>
                  <Menu.Item key="1" onClick={() => handelLogout()}>
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
      <Sider
        className="sidebar"
        trigger={null}
        breakpoint="lg"
        onCollapse={(collapse) => handelCollapse(collapse)}
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
          autoOpen
          hasCollapseButton
          defaultOpenKeys={[
            path.substring(1).indexOf("/") === -1
              ? path
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
            <Skeleton loading={loading} animation text={{ rows: 2 }}>
              <Menu.Item key={`/`} onClick={() => navigate("/")}>
                <span>ALL</span>
              </Menu.Item>
            </Skeleton>
            <Skeleton loading={loading} text={{ rows: 0 }}>
              <Menu.Item key={`/starred`} onClick={() => navigate("/starred")}>
                <span>STARRED</span>
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
      <div
        className="article-list"
        style={{
          backgroundColor: "var(--color-fill-1)",
          paddingTop: "49px",
          paddingLeft: collapsed ? "48px" : "200px",
          height: "calc(100vh - 49px)",
          display: "flex",
          transition: "all 0.1s linear",
          width: collapsed ? "calc(100% - 49px)" : "calc(100% - 200px)",
        }}
      >
        <Outlet />
        <Modal
          title="Settings"
          visible={visible}
          alignCenter={false}
          footer={null}
          unmountOnExit
          style={{ width: "720px", top: "10%" }}
          onCancel={() => {
            setVisible(false);
            initData();
          }}
          autoFocus={false}
          focusLock={true}
        >
          <Settings />
        </Modal>
        <Modal
          title="Add Feed"
          visible={feedModalVisible}
          unmountOnExit
          style={{ width: "400px" }}
          onOk={feedForm.submit}
          confirmLoading={feedModalLoading}
          onCancel={() => {
            setFeedModalVisible(false);
            feedForm.resetFields();
          }}
        >
          <Form
            form={feedForm}
            layout="vertical"
            onChange={(value, values) => console.log(value, values)}
            onSubmit={(values) =>
              handelAddFeed(values.url, values.group, values.crawler)
            }
            labelCol={{
              span: 7,
            }}
            wrapperCol={{
              span: 17,
            }}
          >
            <Form.Item
              label="Feed url"
              field="url"
              rules={[{ required: true }]}
            >
              <Input placeholder="Please input feed url" />
            </Form.Item>
            <Form.Item
              label="Group"
              required
              field="group"
              rules={[{ required: true }]}
            >
              <Select placeholder="Please select">
                {groups.map((group) => (
                  <Select.Option key={group.id} value={group.id}>
                    {group.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Fetch original content"
              initialValue={false}
              field="crawler"
              style={{ marginBottom: 0 }}
              triggerPropName="checked"
              rules={[{ type: "boolean" }]}
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export { useStore };
