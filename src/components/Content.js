import "./Content.css";
import "./Transition.css";
import classNames from "classnames";
import dayjs from "dayjs";
import ImageWithLazyLoading from "./ImageWithLazyLoading";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Button,
  Card,
  Divider,
  Input,
  Message,
  Popconfirm,
  Radio,
  Select,
  Skeleton,
  Space,
  Tooltip,
  Typography,
} from "@arco-design/web-react";
import { CSSTransition } from "react-transition-group";
import {
  handleEscapeKey,
  handleLeftKey,
  handleRightKey,
  handleMKey,
  handleSKey,
} from "../utils/keyHandlers";
import {
  IconArrowDown,
  IconCheck,
  IconEmpty,
  IconMinusCircle,
  IconRecord,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import { Link } from "react-router-dom";
import { updateEntryStatus, updateEntryStarred } from "../apis";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../Store";

dayjs.extend(relativeTime);
const cards = [1, 2, 3, 4];

export default function Content({ info, getEntries, markAllAsRead }) {
  /* 接口返回文章总数原始值，不受接口返回数据长度限制 */
  const [total, setTotal] = useState(0);
  /* 接口返回未读文章数原始值，不受接口返回数据长度限制 */
  const [unreadTotal, setUnreadTotal] = useState(0);
  /* 分页参数 */
  const [offset, setOffset] = useState(0);
  /*all 页签加载更多按钮可见性 */
  const [loadMoreVisible, setLoadMoreVisible] = useState(false);
  /*unread 页签加载更多按钮可见性 */
  const [loadMoreUnreadVisible, setLoadMoreUnreadVisible] = useState(false);
  /* 页面显示的文章 */
  const [entries, setEntries] = useState([]);
  /* 接口返回的文章 */
  const [allEntries, setAllEntries] = useState([]);
  /* 选中的文章 */
  const [activeContent, setActiveContent] = useState(null);
  /* 文章详情进入动画 */
  const [animation, setAnimation] = useState(null);
  /*all unread*/
  const [filterStatus, setFilterStatus] = useState("all");
  /*0-title 1-content*/
  const [filterType, setFilterType] = useState("0");
  /* 搜索文本 */
  const [filterString, setFilterString] = useState("");
  /* 初始 loading*/
  const [loading, setLoading] = useState(true);
  /* 加载更多 loading*/
  const [loadingMore, setLoadingMore] = useState(false);
  /* 更新 menu 中 feed 未读数 */
  const updateFeedUnread = useStore((state) => state.updateFeedUnread);
  /* 更新 menu 中 group 未读数 */
  const updateGroupUnread = useStore((state) => state.updateGroupUnread);
  /*menu 数据初始化函数 */
  const initData = useStore((state) => state.initData);

  const entryListRef = useRef(null);
  const entryDetailRef = useRef(null);
  const cardsRef = useRef(null);

  const getFirstImage = (entry) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content, "text/html");
    const firstImg = doc.querySelector("img");
    if (firstImg) {
      entry.imgSrc = firstImg.getAttribute("src");
    }
    return entry;
  };

  const getArticleList = async () => {
    try {
      setLoading(true);
      const responseAll = await getEntries();
      const responseUnread = await getEntries(offset, "unread");
      if (responseAll?.data?.entries && responseUnread?.data?.total >= 0) {
        const fetchedArticles = responseAll.data.entries.map(getFirstImage);
        setAllEntries(fetchedArticles);

        const filteredArticles =
          filterStatus === "all"
            ? fetchedArticles
            : fetchedArticles.filter((a) => a.status === "unread");
        setEntries(filteredArticles);

        setTotal(responseAll.data.total);
        setLoadMoreVisible(fetchedArticles.length < responseAll.data.total);

        setUnreadTotal(info.from === "history" ? 0 : responseUnread.data.total);
        console.log(
          filteredArticles.length,
          responseUnread.data.total,
          filteredArticles.length < responseUnread.data.total,
        );
        setLoadMoreUnreadVisible(
          filteredArticles.length < responseUnread.data.total,
        );
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getArticleList();
    setActiveContent(null);
    entryListRef.current.scrollTo(0, 0);
    entryDetailRef.current.scrollTo(0, 0);
    setOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);
      const response = await getEntries(offset + 100);
      if (response?.data?.entries) {
        setOffset(offset + 100);
        const newArticlesWithImage = response.data.entries.map(getFirstImage);
        const updatedAllArticles = [
          ...new Map(
            [...allEntries, ...newArticlesWithImage].map((entry) => [
              entry.id,
              entry,
            ]),
          ).values(),
        ];
        setAllEntries(updatedAllArticles);

        const filteredArticles =
          filterStatus === "all"
            ? updatedAllArticles
            : updatedAllArticles.filter((a) => a.status === "unread");
        setEntries(filteredArticles);
        setLoadMoreVisible(updatedAllArticles.length < total);
        setLoadMoreUnreadVisible(filteredArticles.length < unreadTotal);
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handelFilterEntry = (filter_type, filter_status, filter_string) => {
    setEntries([]);
    setFilterType(filter_type);
    setFilterStatus(filter_status);
    setFilterString(filter_string);
    if (filter_type === "0") {
      const filteredArticles =
        filter_status === "all"
          ? allEntries.filter((entry) => entry.title.includes(filter_string))
          : allEntries.filter(
              (entry) =>
                entry.title.includes(filter_string) &&
                entry.status === filter_status,
            );
      setEntries(filteredArticles);
    } else {
      const filteredArticles =
        filter_status === "all"
          ? allEntries.filter((entry) => entry.content.includes(filter_string))
          : allEntries.filter(
              (entry) =>
                entry.content.includes(filter_string) &&
                entry.status === filter_status,
            );
      setEntries(filteredArticles);
    }
    if (filter_status === "unread") {
      const unreadArticles = allEntries.filter(
        (entry) => entry.status === "unread",
      );
      setLoadMoreUnreadVisible(unreadArticles.length < unreadTotal);
    }
  };

  const toggleEntryStatus = () => {
    const newStatus = activeContent.status === "read" ? "unread" : "read";
    const updateStatus = async () => {
      const response = await updateEntryStatus(activeContent);
      if (response) {
        setActiveContent({ ...activeContent, status: newStatus });
        updateFeedUnread(activeContent.feed.id, newStatus);
        updateGroupUnread(activeContent.feed.category.id, newStatus);
        setUnreadTotal(
          newStatus === "read" ? unreadTotal - 1 : unreadTotal + 1,
        );
        const updateEntriesStatus = (entries) =>
          entries.map((entry) =>
            entry.id === activeContent.id
              ? { ...entry, status: newStatus }
              : entry,
          );
        setEntries(updateEntriesStatus(entries));
        setAllEntries(updateEntriesStatus(allEntries));
      }
    };
    updateStatus();
  };

  const toggleEntryStarred = () => {
    const { starred } = activeContent;
    const updateStarred = async () => {
      const response = await updateEntryStarred(activeContent);
      if (response) {
        setActiveContent({ ...activeContent, starred: !starred });
        const updateEntriesStarred = (entries) =>
          entries.map((entry) =>
            entry.id === activeContent.id
              ? { ...entry, starred: !starred }
              : entry,
          );
        setEntries(updateEntriesStarred(entries));
        setAllEntries(updateEntriesStarred(allEntries));
      }
    };
    updateStarred();
  };

  const handelMarkAllAsRead = () => {
    const readAll = async () => {
      const response = await markAllAsRead();
      response && Message.success("Success");
      await initData();
      setAllEntries(allEntries.map((e) => ({ ...e, status: "read" })));
      setEntries(entries.map((e) => ({ ...e, status: "read" })));
      setUnreadTotal(0);
    };
    readAll();
  };

  const updateLocalEntryStatus = (entries, entryId, status) => {
    return entries.map((e) => (e.id === entryId ? { ...e, status } : e));
  };

  const handleClickEntryList = (entry) => {
    const clickCard = async () => {
      if (entry.status === "unread") {
        const response = await updateEntryStatus(entry, "read");
        if (!response) {
          return;
        }
      }

      setAnimation(true);
      setActiveContent({ ...entry, status: "read" });
      if (entry.status === "unread") {
        updateFeedUnread(entry.feed.id, "read");
        updateGroupUnread(entry.feed.category.id, "read");
      }

      setEntries(updateLocalEntryStatus(entries, entry.id, "read"));
      setAllEntries(updateLocalEntryStatus(allEntries, entry.id, "read"));

      setUnreadTotal(entry.status === "unread" ? unreadTotal - 1 : unreadTotal);

      entryDetailRef.current.setAttribute("tabIndex", "-1");
      entryDetailRef.current.focus();
      entryDetailRef.current.scrollTo(0, 0);
    };

    clickCard();
  };

  useEffect(() => {
    const currentIndex = entries.findIndex(
      (entry) => entry.id === activeContent?.id,
    );

    const keyMap = {
      27: () => handleEscapeKey(activeContent, setActiveContent, entryListRef),
      37: () => handleLeftKey(currentIndex, entries, handleClickEntryList),
      39: () => handleRightKey(currentIndex, entries, handleClickEntryList),
      77: () => handleMKey(activeContent, toggleEntryStatus),
      83: () => handleSKey(activeContent, toggleEntryStarred),
    };

    const handleKeyDown = (event) => {
      const handler = keyMap[event.keyCode];
      if (handler) {
        handler();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContent, entries]);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--color-border-2)",
        }}
        className="entry-col"
      >
        <CSSTransition
          in={!loading}
          timeout={200}
          nodeRef={cardsRef}
          classNames="fade"
        >
          <div
            className="entry-list"
            ref={entryListRef}
            style={{
              overflowY: "auto",
              padding: "10px 10px 0 10px",
              width: "302px",
              backgroundColor: "var(--color-fill-1)",
              flex: "1",
            }}
          >
            <Input.Search
              allowClear
              placeholder="filter"
              value={filterString}
              addBefore={
                <Select
                  placeholder="Please select"
                  onChange={(value) => {
                    handelFilterEntry(value, filterStatus, filterString);
                  }}
                  style={{ width: 100 }}
                  value={filterType}
                >
                  <Select.Option value="0">Title</Select.Option>
                  <Select.Option value="1">Content</Select.Option>
                </Select>
              }
              onChange={(value) => {
                handelFilterEntry(filterType, filterStatus, value);
                console.log(value);
              }}
              style={{
                marginBottom: "10px",
                width: "300px",
              }}
            />

            {loading &&
              cards.map((card) => (
                <Card
                  style={{ width: 300, marginBottom: "10px" }}
                  key={card}
                  cover={
                    <Skeleton
                      loading={loading}
                      animation={true}
                      text={{ rows: 0 }}
                      image={{
                        style: {
                          width: 300,
                          height: 160,
                        },
                      }}
                    />
                  }
                >
                  <Card.Meta
                    description={
                      <Skeleton
                        loading={loading}
                        animation={true}
                        text={{ rows: 3, width: 150 }}
                      />
                    }
                  />
                </Card>
              ))}
            <div ref={cardsRef}>
              {entries.map((entry) => (
                <div style={{ marginBottom: "10px" }} key={entry.id}>
                  <Card
                    className={classNames("card-custom-hover-style", {
                      "card-custom-selected-style": activeContent
                        ? entry.id === activeContent.id
                        : false,
                    })}
                    hoverable
                    data-entry-id={entry.id}
                    style={{ width: 300, cursor: "pointer" }}
                    onClick={() => {
                      handleClickEntryList(entry);
                    }}
                    cover={
                      <div
                        style={{
                          display: entry.imgSrc ? "block" : "none",
                          height: 160,
                          overflow: "hidden",
                          borderBottom: "1px solid var(--color-border-1)",
                        }}
                      >
                        <ImageWithLazyLoading
                          width={300}
                          height={160}
                          alt={entry.id}
                          src={entry.imgSrc}
                          status={entry.status}
                        />
                      </div>
                    }
                  >
                    <Card.Meta
                      description={
                        <div>
                          <Typography.Text
                            style={
                              entry.status === "unread"
                                ? { fontWeight: "500" }
                                : {
                                    color: "var(--color-text-3)",
                                    fontWeight: "500",
                                  }
                            }
                          >
                            {entry.title}
                          </Typography.Text>
                          <Typography.Text
                            style={{
                              color: "var(--color-text-3)",
                              fontSize: "13px",
                            }}
                          >
                            <br />
                            {entry.feed.title.toUpperCase()}
                            <br />
                            {dayjs().to(dayjs(entry.created_at))}
                          </Typography.Text>
                          {entry.starred && (
                            <IconStarFill
                              style={{
                                fontSize: "13px",
                                marginLeft: "8px",
                                color: "var(--color-text-3)",
                              }}
                            />
                          )}
                        </div>
                      }
                    />
                  </Card>
                </div>
              ))}
            </div>
            {filterStatus === "all" && loadMoreVisible && (
              <Button
                onClick={handleLoadMore}
                loading={loadingMore}
                long={true}
                style={{ margin: "10px auto", display: "block" }}
              >
                {!loadingMore && <IconArrowDown />}Load more
              </Button>
            )}

            {filterStatus === "unread" && loadMoreUnreadVisible && (
              <Button
                onClick={handleLoadMore}
                loading={loadingMore}
                long={true}
                style={{ margin: "10px auto", display: "block" }}
              >
                {!loadingMore && <IconArrowDown />}Load more
              </Button>
            )}
          </div>
        </CSSTransition>
        <div
          className="entry-panel"
          style={{
            // position: "absolute",
            backgroundColor: "var(--color-bg-2)",
            bottom: "0",
            display: "flex",
            flexDirection: "row",
            padding: "8px 10px",
            // width: "302px",
            zIndex: "100",
            justifyContent: "space-between",
            borderTop: "1px solid var(--color-border-2)",
          }}
        >
          <Radio.Group
            type="button"
            name="lang"
            value={filterStatus}
            onChange={(value) => {
              entryListRef.current.scrollTo(0, 0);
              handelFilterEntry(filterType, value, filterString);
            }}
          >
            <Radio value="all">ALL</Radio>
            <Radio value="unread">UNREAD</Radio>
          </Radio.Group>
          {info.from !== "starred" && info.from !== "history" && (
            <Popconfirm
              focusLock
              title="Mark All As Read?"
              onOk={() => handelMarkAllAsRead()}
            >
              <Button icon={<IconCheck />} shape="circle"></Button>
            </Popconfirm>
          )}
        </div>
      </div>
      <CSSTransition
        in={animation}
        timeout={200}
        nodeRef={entryDetailRef}
        classNames="fade"
        onEntered={() => setAnimation(false)}
      >
        {activeContent ? (
          <div
            ref={entryDetailRef}
            className="article-content"
            style={{
              paddingTop: "40px",
              paddingBottom: "40px",
              paddingLeft: "5%",
              paddingRight: "5%",
              flex: "1",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <div
              className="article-title"
              style={{
                maxWidth: "600px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <Typography.Text
                style={{ color: "var(--color-text-3)", fontSize: "10px" }}
              >
                {dayjs(activeContent.created_at)
                  .format("MMMM D, YYYY")
                  .toUpperCase()}
                {" AT "}
                {dayjs(activeContent.created_at).format("hh:mm")}
              </Typography.Text>
              <Typography.Title heading={3} style={{ margin: 0 }}>
                <a
                  href={activeContent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {activeContent.title}
                </a>
              </Typography.Title>
              <Typography.Text
                style={{ color: "var(--color-text-3)", fontSize: "10px" }}
              >
                <Link
                  to={`/feed/${activeContent.feed.id}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {activeContent.feed.title.toUpperCase()}
                </Link>
              </Typography.Text>
              <Divider />
            </div>
            <div
              dangerouslySetInnerHTML={{ __html: activeContent.content }}
              className="article-body"
              style={{
                fontSize: "1.2em",
                overflowWrap: "break-word",
                maxWidth: "600px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            ></div>
          </div>
        ) : (
          <div
            ref={entryDetailRef}
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--color-fill-1)",
              color: "var(--color-text-3)",
              alignItems: "center",
              justifyContent: "center",
              flex: "1",
              padding: "40px 16px",
            }}
          >
            <IconEmpty style={{ fontSize: "64px" }} />
            <Typography.Title
              heading={6}
              style={{ color: "var(--color-text-3)", marginTop: "10px" }}
            >
              {"Reactflux".toUpperCase()}
            </Typography.Title>
          </div>
        )}
      </CSSTransition>
      {activeContent ? (
        <div
          style={{
            position: "fixed",
            borderRadius: "50%",
            bottom: "20px",
            right: "10px",
            boxShadow: "0 4px 10px rgba(var(--primary-6), 0.4)",
          }}
        >
          <Space size={0} direction="vertical">
            <Tooltip
              mini
              position="left"
              content={
                activeContent.status === "unread"
                  ? "Mark as Read"
                  : "Mark as Unread"
              }
            >
              <Button
                type="primary"
                size="mini"
                style={{
                  borderBottom: "1px solid rgb(var(--primary-5))",
                  borderRadius: "50% 50% 0 0",
                }}
                onClick={() => toggleEntryStatus()}
                icon={
                  activeContent.status === "unread" ? (
                    <IconMinusCircle />
                  ) : (
                    <IconRecord />
                  )
                }
              />
            </Tooltip>
            <Tooltip
              mini
              position="left"
              content={activeContent.starred === false ? "Star" : "Unstar"}
            >
              <Button
                type="primary"
                size="mini"
                style={{
                  borderRadius: "0 0 50% 50%",
                }}
                onClick={() => toggleEntryStarred()}
                icon={
                  activeContent.starred ? (
                    <IconStarFill style={{ color: "#ffcd00" }} />
                  ) : (
                    <IconStar />
                  )
                }
              />
            </Tooltip>
          </Space>
        </div>
      ) : null}
    </>
  );
}
