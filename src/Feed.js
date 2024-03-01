import { useParams } from "react-router-dom";
import axios from "axios";
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
import "./Feed.css";
import dayjs from "dayjs";
import {
  IconCheck,
  IconEmpty,
  IconEye,
  IconEyeInvisible,
} from "@arco-design/web-react/icon";
import ImageWithLazyLoading from "./components/ImageWithLazyLoading";

export default function Feed() {
  const { f_id } = useParams();
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [activeContent, setActiveContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterString, setFilterString] = useState("");

  const entryListRef = useRef(null);
  const entryDetailRef = useRef(null);

  useEffect(() => {
    getFeedEntries(f_id);
    setActiveContent(null);
    entryListRef.current.scrollTo(0, 0);
    entryDetailRef.current.scrollTo(0, 0);
  }, [f_id]);
  async function getFeedEntries(id) {
    setLoading(true);
    try {
      const response = await axios({
        method: "get",
        url: `/v1/feeds/${id}/entries?order=published_at&direction=desc`,
        baseURL: "https://rss.electh.top",
        headers: {
          "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
        },
      });
      console.log(response);
      response.data.entries.map((entry) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(entry.content, "text/html");
        const firstImg = doc.querySelector("img");
        if (firstImg) {
          entry.src = firstImg.getAttribute("src");
          setAllEntries(response.data.entries);
          filterStatus === "all"
            ? setEntries(response.data.entries)
            : setEntries(
                response.data.entries.filter(
                  (entry) => entry.status === filterStatus,
                ),
              );
        }
      });
    } catch (error) {
      console.error(error);
      Message.error(error.message);
    }
    setLoading(false);
  }

  function handelUpdateEntry() {
    async function updateEntry() {
      const newStatus = activeContent.status === "read" ? "unread" : "read";
      try {
        const response = await axios({
          method: "put",
          url: `/v1/entries`,
          baseURL: "https://rss.electh.top",
          headers: {
            "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
          },
          data: { entry_ids: [activeContent.id], status: newStatus },
        });
        console.log(response);
        setActiveContent({
          ...activeContent,
          status: newStatus,
        });
        Message.success("Success");
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
      } catch (error) {
        console.error(error);
        Message.error(error.message);
      }
    }
    updateEntry();
  }

  function handelMarkAllAsRead() {
    async function markAllAsRead() {
      try {
        const response = await axios({
          method: "put",
          url: `/v1/feeds/${f_id}/mark-all-as-read`,
          baseURL: "https://rss.electh.top",
          headers: {
            "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
          },
        });
        console.log(response);
        Message.success("Success");
        getFeedEntries(f_id);
      } catch (error) {
        console.error(error);
        Message.error(error.message);
      }
    }
    markAllAsRead();
  }

  function handelClickEntryList(entry) {
    async function clickEntryList() {
      try {
        const response = await axios({
          method: "put",
          url: `/v1/entries`,
          baseURL: "https://rss.electh.top",
          headers: {
            "X-Auth-Token": "BavpWWSYgc1CbJiA5d7nJ-07FqRVl6P4jfoR5C4y_Tk=",
          },
          data: { entry_ids: [entry.id], status: "read" },
        });
        console.log(response);
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
      } catch (error) {
        console.error(error);
        Message.error(error.message);
      }
      entryDetailRef.current.scrollTo(0, 0);
    }
    clickEntryList();
  }

  return (
    <>
      <div
        ref={entryListRef}
        style={{
          overflowY: "auto",
          borderRight: "1px solid var(--color-border-2)",
          padding: "62px 10px 0 10px",
          width: "302px",
          backgroundColor: "var(--color-fill-1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            backgroundColor: "var(--color-bg-2)",
            top: "0",
            display: "flex",
            flexDirection: "row",
            padding: "8px 10px",
            width: "302px",
            zIndex: "100",
            justifyContent: "space-between",
            marginLeft: "-10px",
            borderBottom: "1px solid var(--color-border-2)",
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
            <Radio value="unread">
              UNREAD
              <Typography.Text type={"secondary"} style={{ marginLeft: "5px" }}>
                {allEntries.filter((e) => e.status === "unread").length}
              </Typography.Text>
            </Radio>
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
              position: "absolute",
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
            padding: "40px 100px",
            flex: "1",
            overflowY: "auto",
            minWidth: "700px",
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
