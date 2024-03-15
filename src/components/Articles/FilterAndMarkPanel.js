import { Button, Message, Popconfirm, Radio } from "@arco-design/web-react";
import { IconCheck } from "@arco-design/web-react/icon";
import { forwardRef, useContext, useEffect } from "react";

import { useStore } from "../../Store";
import UseFilterEntries from "../../hooks/useFilterEntries";
import useLoadMore from "../../hooks/useLoadMore";
import { ContentContext } from "../ContentContext";

const FilterAndMarkPanel = forwardRef(
  ({ info, getEntries, markAllAsRead, entryDetailRef }, ref) => {
    const {
      allEntries,
      entries,
      filterStatus,
      filterString,
      filterType,
      offset,
      setActiveContent,
      setAllEntries,
      setEntries,
      setLoading,
      setLoadMoreUnreadVisible,
      setLoadMoreVisible,
      setOffset,
      setTotal,
      setUnreadTotal,
    } = useContext(ContentContext);

    const { handleFilter } = UseFilterEntries();
    const { getFirstImage } = useLoadMore();

    /*menu 数据初始化函数 */
    const initData = useStore((state) => state.initData);

    const fetchEntries = async () => {
      const responseAll = await getEntries();
      const responseUnread = await getEntries(offset, "unread");
      return { responseAll, responseUnread };
    };

    const processEntries = (responseAll) => {
      const fetchedArticles = responseAll.data.entries.map(getFirstImage);

      const filteredArticles =
        filterStatus === "all"
          ? fetchedArticles
          : fetchedArticles.filter((a) => a.status === "unread");

      return { fetchedArticles, filteredArticles };
    };

    const updateUI = (
      fetchedArticles,
      filteredArticles,
      responseAll,
      responseUnread,
    ) => {
      setAllEntries(fetchedArticles);
      setEntries(filteredArticles);

      setTotal(responseAll.data.total);
      setLoadMoreVisible(fetchedArticles.length < responseAll.data.total);
      setUnreadTotal(info.from === "history" ? 0 : responseUnread.data.total);
      setLoadMoreUnreadVisible(
        filteredArticles.length < responseUnread.data.total,
      );
    };

    const handleResponses = (responseAll, responseUnread) => {
      if (responseAll?.data?.entries && responseUnread?.data?.total >= 0) {
        const { fetchedArticles, filteredArticles } =
          processEntries(responseAll);
        updateUI(
          fetchedArticles,
          filteredArticles,
          responseAll,
          responseUnread,
        );
      }
    };

    const getArticleList = async () => {
      setLoading(true);
      try {
        const { responseAll, responseUnread } = await fetchEntries();
        handleResponses(responseAll, responseUnread);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      getArticleList();
      setActiveContent(null);
      if (ref.current) {
        ref.current.scrollTo(0, 0);
      }
      if (entryDetailRef.current) {
        entryDetailRef.current.scrollTo(0, 0);
      }
      setOffset(0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [info]);

    const handleMarkAllAsRead = () => {
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

    return info.from !== "history" ? (
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
            if (ref.current) {
              ref.current.scrollTo(0, 0);
            }
            handleFilter(filterType, value, filterString);
          }}
        >
          <Radio value="all">ALL</Radio>
          <Radio value="unread">UNREAD</Radio>
        </Radio.Group>
        {info.from !== "today" && info.from !== "starred" && (
          <Popconfirm
            focusLock
            title="Mark All As Read?"
            onOk={() => handleMarkAllAsRead()}
          >
            <Button icon={<IconCheck />} shape="circle"></Button>
          </Popconfirm>
        )}
      </div>
    ) : null;
  },
);

export default FilterAndMarkPanel;
