import classNames from "classnames";
import { CSSTransition } from "react-transition-group";
import { useStore } from "../App";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Divider,
  Radio,
  Input,
  Typography,
  Skeleton,
  Popconfirm,
  Message,
  Select,
  Space,
  Tooltip,
} from "@arco-design/web-react";
import "./Content.css";
import "./Transition.css";
import dayjs from "dayjs";
import {
  IconArrowDown,
  IconCheck,
  IconEmpty,
  IconMinusCircle,
  IconRecord,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon";
import ImageWithLazyLoading from "./ImageWithLazyLoading";
import { clickEntryList, updateEntry, starEntry } from "../apis";

const cards = [1, 2, 3];

export default function Content({ info, getEntries, markAllAsRead }) {
  /*接口返回文章总数原始值，不受接口返回数据长度限制*/
  const [total, setTotal] = useState(0);
  /*接口返回未读文章数原始值，不受接口返回数据长度限制*/
  const [unreadTotal, setUnreadTotal] = useState(0);
  /*分页参数*/
  const [offset, setOffset] = useState(0);
  /*all页签加载更多按钮可见性*/
  const [loadMoreVisible, setLoadMoreVisible] = useState(false);
  /*unread页签加载更多按钮可见性*/
  const [loadMoreUnreadVisible, setLoadMoreUnreadVisible] = useState(false);
  /*页面显示的文章*/
  const [entries, setEntries] = useState([]);
  /*接口返回的文章*/
  const [allEntries, setAllEntries] = useState([]);
  /*选中的文章*/
  const [activeContent, setActiveContent] = useState(null);
  /*文章详情进入动画*/
  const [animation, setAnimation] = useState(null);
  /*all unread*/
  const [filterStatus, setFilterStatus] = useState("all");
  /*0-title 1-content*/
  const [filterType, setFilterType] = useState("0");
  /*搜索文本*/
  const [filterString, setFilterString] = useState("");
  /*初始loading*/
  const [loading, setLoading] = useState(true);
  /*加载更多loading*/
  const [loadingMore, setLoadingMore] = useState(false);
  /*更新menu中feed未读数*/
  const updateFeedUnread = useStore((state) => state.updateFeedUnread);
  /*更新menu中group未读数*/
  const updateGroupUnread = useStore((state) => state.updateGroupUnread);
  /*menu数据初始化函数*/
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

        setUnreadTotal(responseUnread.data.total);
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
      setLoadMoreUnreadVisible(filteredArticles.length < unreadTotal);
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
      setLoadMoreUnreadVisible(filteredArticles.length < unreadTotal);
    }
  };

  const handleUpdateEntry = () => {
    const newStatus = activeContent.status === "read" ? "unread" : "read";
    const switchArticleStatus = async () => {
      const response = await updateEntry(activeContent);
      if (response) {
        setActiveContent({
          ...activeContent,
          status: newStatus,
        });
        updateFeedUnread(activeContent.feed.id, newStatus);
        updateGroupUnread(activeContent.feed.category.id, newStatus);
        setEntries(
          entries.map((e) =>
            e.id === activeContent.id
              ? {
                  ...e,
                  status: newStatus,
                }
              : { ...e },
          ),
        );
        setAllEntries(
          allEntries.map((e) =>
            e.id === activeContent.id
              ? {
                  ...e,
                  status: newStatus,
                }
              : { ...e },
          ),
        );
      }
    };
    switchArticleStatus();
  };

  const handleStarEntry = () => {
    const { starred } = activeContent;
    const switchArticleStarred = async () => {
      const response = await starEntry(activeContent);
      if (response) {
        setActiveContent({
          ...activeContent,
          starred: !starred,
        });
        setEntries(
          entries.map((e) =>
            e.id === activeContent.id
              ? {
                  ...e,
                  starred: !starred,
                }
              : { ...e },
          ),
        );
        setAllEntries(
          allEntries.map((e) =>
            e.id === activeContent.id
              ? {
                  ...e,
                  starred: !starred,
                }
              : { ...e },
          ),
        );
      }
    };
    switchArticleStarred();
  };

  const handelMarkAllAsRead = () => {
    const readAll = async () => {
      const response = await markAllAsRead();
      response && Message.success("Success");
      await initData();
      setAllEntries(allEntries.map((e) => ({ ...e, status: "read" })));
      setEntries(entries.map((e) => ({ ...e, status: "read" })));
    };
    readAll();
  };

  const handleClickEntryList = (entry) => {
    const clickCard = async () => {
      setAnimation(null);
      const response = await clickEntryList(entry);
      if (response) {
        setAnimation(true);
        setActiveContent({
          ...entry,
          status: "read",
        });
        if (entry.status === "unread") {
          updateFeedUnread(entry.feed.id, "read");
          updateGroupUnread(entry.feed.category.id, "read");
        }
        setEntries(
          entries.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: "read",
                }
              : { ...e },
          ),
        );
        setAllEntries(
          allEntries.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  status: "read",
                }
              : { ...e },
          ),
        );
        entryDetailRef.current.setAttribute("tabIndex", "-1");
        entryDetailRef.current.focus();
      }
      entryDetailRef.current.scrollTo(0, 0);
    };
    clickCard();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const currentIndex = entries.findIndex(
        (entry) => entry.id === activeContent?.id,
      );

      // ESC, go back to entry list
      if (event.keyCode === 27 && activeContent) {
        setActiveContent(null);
        if (entryListRef.current) {
          entryListRef.current.setAttribute("tabIndex", "-1");
          entryListRef.current.focus();
        }
      }

      // LEFT, go to previous entry
      if (event.keyCode === 37 && currentIndex > 0) {
        const prevEntry = entries[currentIndex - 1];
        handleClickEntryList(prevEntry);
        let card = document.querySelector(".card-custom-selected-style");
        if (card) card.scrollIntoView(false);
      }

      // RIGHT, go to next entry
      if (event.keyCode === 39 && currentIndex < entries.length - 1) {
        const nextEntry = entries[currentIndex + 1];
        handleClickEntryList(nextEntry);
        let card = document.querySelector(".card-custom-selected-style");
        if (card) card.scrollIntoView(true);
      }

      // M, mark as read or unread
      if (event.keyCode === 77 && activeContent) {
        handleUpdateEntry();
      }

      // S, star or unstar
      if (event.keyCode === 83 && activeContent) {
        handleStarEntry();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContent, entries, handleClickEntryList, handleUpdateEntry]);

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
          <Popconfirm
            disabled={info.from === "starred"}
            focusLock
            title="Mark All As Read?"
            okText="Confirm"
            cancelText="Cancel"
            onOk={() => handelMarkAllAsRead()}
          >
            <Button
              icon={<IconCheck />}
              shape="circle"
              disabled={info.from === "starred"}
            ></Button>
          </Popconfirm>
        </div>
      </div>
      <CSSTransition
        in={animation}
        timeout={200}
        nodeRef={entryDetailRef}
        classNames="fade"
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
                onClick={() => handleUpdateEntry()}
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
                onClick={() => handleStarEntry()}
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
