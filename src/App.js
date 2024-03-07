import _ from "lodash";
import { create } from "zustand";
import "./App.css";
import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Divider,
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
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import {
  IconBook,
  IconFile,
  IconFolder,
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
const SubMenu = Menu.SubMenu;
const Sider = Layout.Sider;

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
        unread: unreadInfo[feed.id] ? unreadInfo[feed.id] : 0,
      }));
      const groupsWithUnread = groupResponse.data.map((group) => {
        const unreadCount = feedsWithUnread.reduce((total, feed) => {
          if (feed.category.id === group.id) {
            return total + feed.unread;
          } else {
            return total;
          }
        }, 0);
        const feedCount = feedsWithUnread.reduce((total, feed) => {
          if (feed.category.id === group.id) {
            return total + 1;
          } else {
            return total;
          }
        }, 0);

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
  updateFeedUnreadCount: (feed_id, newStatus) => {
    set((state) => {
      const updatedFeeds = state.feeds.map((feed) =>
        feed.id === feed_id
          ? {
              ...feed,
              unread: newStatus === "read" ? feed.unread - 1 : feed.unread + 1,
            }
          : feed,
      );
      return { feeds: updatedFeeds };
    });
  },
  updateGroupUnreadCount: (group_id, newStatus) => {
    set((state) => {
      const updatedGroups = state.groups.map((group) =>
        group.id === group_id
          ? {
              ...group,
              unread:
                newStatus === "read" ? group.unread - 1 : group.unread + 1,
            }
          : group,
      );
      return { groups: updatedGroups };
    });
  },
}));

export default function App() {
  const navigate = useNavigate();
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
  let path = useLocation().pathname;
  useEffect(() => {
    console.log(path);
    console.log(
      path.substring(1).indexOf("/") === -1
        ? path
        : path.substring(0, path.substring(1).indexOf("/") + 1),
    );
  }, [path]);
  useEffect(() => {
    initData();
    initTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handelToggle() {
    if (theme === "light") {
      document.body.setAttribute("arco-theme", "dark");
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
  }

  function initTheme() {
    if (theme === "dark") {
      document.body.setAttribute("arco-theme", "dark");
    } else {
      document.body.removeAttribute("arco-theme");
    }
  }

  function handelCollapse(collapse) {
    setCollapsed(collapse);
  }

  async function handelAddFeed(feed_url, group_id) {
    setFeedModalLoading(true);
    const response = await addFeed(feed_url, group_id);
    if (response) {
      initData();
      Message.success("Success");
      setFeedModalVisible(false);
    }
    setFeedModalLoading(false);
    feedForm.resetFields();
  }

  function handelLogout() {
    localStorage.removeItem("server");
    localStorage.removeItem("token");
    localStorage.removeItem("theme");
    document.body.removeAttribute("arco-theme");
    navigate("/login");
    Message.success("logout");
  }

  return (
    <div className="app" style={{ display: "flex" }}>
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
          height: "60px",
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
            ReactFlux
          </Typography.Title>
        </div>
        <div className="button-group" style={{ marginRight: "20px" }}>
          <Space size={20}>
            <Tooltip content="Add feed">
              <Button
                shape="circle"
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
              <Avatar size={32} style={{ cursor: "pointer" }}>
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
          height: "calc(100% - 61px)",
          borderRight: "1px solid var(--color-border-2)",
          position: "fixed",
          top: "61px",
          zIndex: "999",
        }}
      >
        <Menu
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
          <Menu.Item key={`/`} onClick={() => navigate("/")}>
            <IconList />
            ARTICLES
          </Menu.Item>
          {collapsed ? null : <Divider style={{ margin: "4px" }} />}
          <SubMenu
            key={`/group`}
            title={
              <>
                <IconFolder />
                GROUPS
              </>
            }
          >
            <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
            {!loading
              ? groups.map((group) => (
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
                        style={{ width: "80%" }}
                      >
                        {group.title.toUpperCase()}{" "}
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
                ))
              : null}
          </SubMenu>
          {collapsed ? null : <Divider style={{ margin: "4px" }} />}
          <SubMenu
            key={`/feed`}
            title={
              <>
                <IconFile />
                FEEDS
              </>
            }
          >
            <Skeleton loading={loading} animation={true} text={{ rows: 6 }} />
            {!loading
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
                        style={{ width: "80%" }}
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
          backgroundColor: "var(--color-bg-1)",
          paddingTop: "61px",
          paddingLeft: collapsed ? "48px" : "200px",
          height: "calc(100vh - 61px)",
          display: "flex",
          transition: "all 0.1s linear",
          width: "100%",
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
          onOk={feedForm.submit}
          confirmLoading={feedModalLoading}
          onCancel={() => {
            setFeedModalVisible(false);
            feedForm.resetFields();
          }}
        >
          <Form
            form={feedForm}
            onChange={(value, values) => console.log(value, values)}
            onSubmit={(values) => handelAddFeed(values.url, values.group)}
            labelCol={{
              style: { flexBasis: 90 },
            }}
            wrapperCol={{
              style: { flexBasis: "calc(100% - 90px)" },
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
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export { useStore };
