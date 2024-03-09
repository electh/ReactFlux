import classNames from "classnames";
import { CSSTransition } from "react-transition-group";
import { useStore } from "../App";
import { useEffect, useRef, useState } from "react";
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
  Tooltip,
} from "@arco-design/web-react";
import "./Content.css";
import "./Transition.css";
import dayjs from "dayjs";
import {
  IconCheck,
  IconEmpty,
  IconEye,
  IconEyeInvisible,
} from "@arco-design/web-react/icon";
import ImageWithLazyLoading from "./ImageWithLazyLoading";
import { updateEntry, clickEntryList } from "../apis";

const cards = [1, 2, 3];

export default function Content({ info, getEntries, markAllAsRead }) {
  const [offset, setOffset] = useState(0);
  const [loadMoreVisible, setLoadMoreVisible] = useState(false);
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [activeContent, setActiveContent] = useState(null);
  const [animation, setAnimation] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterString, setFilterString] = useState("");
  const [loading, setLoading] = useState(true);
  const updateFeedUnreadCount = useStore(
    (state) => state.updateFeedUnreadCount,
  );
  const updateGroupUnreadCount = useStore(
    (state) => state.updateGroupUnreadCount,
  );
  const initData = useStore((state) => state.initData);

  const entryListRef = useRef(null);
  const entryDetailRef = useRef(null);
  const bodyRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    getArticleList();
    setActiveContent(null);
    entryListRef.current.scrollTo(0, 0);
    entryDetailRef.current.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  function getFirstImage(entry) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content, "text/html");
    const firstImg = doc.querySelector("img");
    if (firstImg) {
      entry.imgSrc = firstImg.getAttribute("src");
    }
    return entry;
  }

  function filterArticles(articles, status) {
    return status === "all"
      ? articles
      : articles.filter((article) => article.status === status);
  }

  async function getArticleList() {
    try {
      setLoading(true);
      const response = await getEntries();
      if (response && response.data.entries) {
        const fetchedArticles = response.data.entries.map(getFirstImage);
        setAllEntries(fetchedArticles);

        const filteredArticles = filterArticles(fetchedArticles, filterStatus);
        setEntries(filteredArticles);
        setLoadMoreVisible(fetchedArticles.length < response.data.total);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    try {
      setLoading(true);
      const response = await getEntries(offset + 100);
      setOffset(offset + 100);
      if (response && response.data.entries) {
        const updatedArticles = [...entries, ...response.data.entries].map(
          getFirstImage,
        );
        setAllEntries(updatedArticles);

        const filteredArticles = filterArticles(updatedArticles, filterStatus);
        setEntries(filteredArticles);
        setLoadMoreVisible(updatedArticles.length < response.data.total);
      }
    } catch (error) {
      console.error("Error fetching more articles:", error);
    } finally {
      setLoading(false);
    }
  }

  function handelUpdateEntry() {
    const newStatus = activeContent.status === "read" ? "unread" : "read";
    async function switchArticleStatus() {
      const response = await updateEntry(activeContent);
      if (response) {
        setActiveContent({
          ...activeContent,
          status: newStatus,
        });
        updateFeedUnreadCount(activeContent.feed.id, newStatus);
        updateGroupUnreadCount(activeContent.feed.category.id, newStatus);
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
    }
    switchArticleStatus();
  }

  function handelMarkAllAsRead() {
    async function readAll() {
      const response = await markAllAsRead();
      response && Message.success("Success");
      await initData();
      setAllEntries(allEntries.map((e) => ({ ...e, status: "read" })));
      setEntries(entries.map((e) => ({ ...e, status: "read" })));
    }
    readAll();
  }

  function handelClickEntryList(entry) {
    async function clickCard() {
      setAnimation(null);
      const response = await clickEntryList(entry);
      if (response) {
        setAnimation(true);
        setActiveContent({
          ...entry,
          status: "read",
        });
        if (entry.status === "unread") {
          updateFeedUnreadCount(entry.feed.id, "read");
          updateGroupUnreadCount(entry.feed.category.id, "read");
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
      }
      entryDetailRef.current.scrollTo(0, 0);
    }
    clickCard();
  }

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
            onChange={(value) => {
              setFilterString(value);
              setEntries(
                filterStatus === "all"
                  ? allEntries.filter((entry) => entry.title.includes(value))
                  : allEntries.filter(
                      (entry) =>
                        entry.title.includes(value) &&
                        entry.status === filterStatus,
                    ),
              );
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
                  handelClickEntryList(entry);
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
                    </div>
                  }
                />
              </Card>
            </div>
          ))}
          {loadMoreVisible && (
            <Button
              onClick={handleLoadMore}
              style={{ margin: "10px auto", display: "block" }}
            >
              LOAD MORE
            </Button>
          )}
        </div>
        <div
          className="entry-panel"
          style={{
            //position: "absolute",
            backgroundColor: "var(--color-bg-2)",
            bottom: "0",
            display: "flex",
            flexDirection: "row",
            padding: "8px 10px",
            //width: "302px",
            zIndex: "100",
            justifyContent: "space-between",
            borderTop: "1px solid var(--color-border-2)",
          }}
        >
          <Radio.Group
            type="button"
            name="lang"
            defaultValue={filterStatus}
            onChange={(value) => {
              setFilterStatus(value);
              value === "all"
                ? setEntries(
                    allEntries.filter((entry) =>
                      entry.title.includes(filterString),
                    ),
                  )
                : setEntries(
                    allEntries.filter(
                      (entry) =>
                        (entry.status === value) &
                        entry.title.includes(filterString),
                    ),
                  );
            }}
          >
            <Radio value="all">ALL</Radio>
            <Radio value="unread">UNREAD</Radio>
          </Radio.Group>
          <Popconfirm
            focusLock
            title="Mark All As Read?"
            okText="Confirm"
            cancelText="Cancel"
            onOk={() => handelMarkAllAsRead()}
          >
            <Button icon={<IconCheck />} shape="circle"></Button>
          </Popconfirm>
        </div>
      </div>
      {activeContent && (
        <Tooltip
          position="left"
          content={
            activeContent.status === "unread"
              ? "Mark As Read?"
              : "Mark As Unread?"
          }
        >
          <Button
            shape="circle"
            type="primary"
            onClick={() => handelUpdateEntry()}
            icon={
              activeContent.status === "unread" ? (
                <IconEye />
              ) : (
                <IconEyeInvisible />
              )
            }
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              boxShadow: "0 2px 12px 0 rgba(0,0,0,.1)",
            }}
          />
        </Tooltip>
      )}
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
              padding: "40px 16px",
              flex: "1",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <div
              ref={titleRef}
              className="article-title"
              style={{
                maxWidth: "600px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <Typography.Text style={{ color: "var(--color-text-3)" }}>
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
              <Typography.Text style={{ color: "var(--color-text-3)" }}>
                {activeContent.feed.title.toUpperCase()}
              </Typography.Text>
              <Divider />
            </div>
            <div
              ref={bodyRef}
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
    </>
  );
}
