import classNames from "classnames";
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
import dayjs from "dayjs";
import {
  IconCheck,
  IconEmpty,
  IconEye,
  IconEyeInvisible,
} from "@arco-design/web-react/icon";
import ImageWithLazyLoading from "./ImageWithLazyLoading";
import { updateEntry, clickEntryList } from "../apis";

export default function Content({ info, getEntries, markAllAsRead }) {
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [activeContent, setActiveContent] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterString, setFilterString] = useState("");
  const [loading, setLoading] = useState(true);

  const entryListRef = useRef(null);
  const entryDetailRef = useRef(null);

  useEffect(() => {
    getArticleList();
    setActiveContent(null);
    entryListRef.current.scrollTo(0, 0);
    entryDetailRef.current.scrollTo(0, 0);
  }, [info]);

  function getArticleList() {
    async function getAlist() {
      setLoading(true);
      const response = await getEntries();
      if (response) {
        const aList = response.data.entries;
        aList.map((entry) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(entry.content, "text/html");
          const firstImg = doc.querySelector("img");
          if (firstImg) {
            entry.src = firstImg.getAttribute("src");
            setAllEntries(aList);
            filterStatus === "all"
              ? setEntries(aList)
              : setEntries(
                  aList.filter((entry) => entry.status === filterStatus),
                );
          }
        });
      }
      setLoading(false);
    }
    getAlist();
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
      setAllEntries(allEntries.map((e) => ({ ...e, status: "read" })));
      setEntries(entries.map((e) => ({ ...e, status: "read" })));
    }
    readAll();
  }

  function handelClickEntryList(entry) {
    async function clickCard() {
      const response = await clickEntryList(entry);
      if (response) {
        setActiveContent({
          ...entry,
          status: "read",
        });
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
                        entry.title.includes(value) &
                        (entry.status === filterStatus),
                    ),
              );
              console.log(value);
            }}
            style={{
              marginBottom: "10px",
              width: "300px",
            }}
          />
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
                  <Skeleton
                    loading={loading}
                    text={{ rows: 0 }}
                    image={{
                      style: {
                        width: 300,
                        height: 160,
                      },
                    }}
                    animation={true}
                  >
                    <div
                      style={{
                        display: entry.src ? "block" : "none",
                        height: 160,
                        overflow: "hidden",
                        borderBottom: "1px solid var(--color-border-1)",
                      }}
                    >
                      <ImageWithLazyLoading
                        width={300}
                        height={160}
                        alt={entry.id}
                        src={entry.src}
                        status={entry.status}
                      />
                    </div>
                  </Skeleton>
                }
              >
                <Card.Meta
                  description={
                    <Skeleton
                      loading={loading}
                      animation={true}
                      text={{ rows: 3 }}
                    >
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
                          {entry.feed.title}
                        </Typography.Text>
                      </div>
                    </Skeleton>
                  }
                />
              </Card>
            </div>
          ))}
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
      {activeContent ? (
        <div
          ref={entryDetailRef}
          className="article-content"
          style={{
            padding: "5%",
            flex: "1",
            overflowY: "auto",
            backgroundColor: "var(--color-fill-1)",
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
            <a href={activeContent.url} target="_blank">
              {activeContent.title}
            </a>
          </Typography.Title>
          <Typography.Text style={{ color: "var(--color-text-3)" }}>
            {activeContent.feed.title}{" "}
          </Typography.Text>
          <Divider />
          <div
            dangerouslySetInnerHTML={{ __html: activeContent.content }}
            className="article-body"
            style={{ fontSize: "1.2em" }}
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
            padding: "5%",
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
    </>
  );
}
