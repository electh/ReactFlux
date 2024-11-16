import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "@arco-design/web-react"
import { IconDelete, IconEdit, IconQuestionCircle, IconRefresh } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { atom, computed } from "nanostores"
import { Fragment, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { deleteFeed, refreshAllFeed, refreshFeed, updateFeed } from "@/apis"
import CustomLink from "@/components/ui/CustomLink"
import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { categoriesState, dataState, setFeedsData } from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import { generateRelativeTime, getUTCDate } from "@/utils/date"
import { filterByQuery } from "@/utils/kmp"
import createSetter from "@/utils/nanostores"
import sleep from "@/utils/time"
import "./FeedList.css"

const filterStringState = atom("")
const setFilterString = createSetter(filterStringState)

const filterTypeState = atom("title")
const setFilterType = createSetter(filterTypeState)

const filteredFeedsState = computed(
  [dataState, filterStringState, filterTypeState],
  (data, filterString, filterType) => {
    const { feedsData } = data
    const feeds = [...feedsData]
      .sort((a, b) => {
        if (a.disabled && !b.disabled) {
          return 1
        }
        if (!a.disabled && b.disabled) {
          return -1
        }
        return 0
      })
      .sort((a, b) => b.parsing_error_count - a.parsing_error_count)

    if (!filterString) {
      return feeds
    }
    return filterByQuery(feeds, filterString, [filterType])
  },
)

const tableDataState = computed(filteredFeedsState, (filteredFeeds) => {
  return filteredFeeds.map((feed) => ({
    category: feed.category,
    checked_at: feed.checked_at,
    crawler: feed.crawler,
    disabled: feed.disabled,
    feed_url: feed.feed_url,
    hidden: feed.hide_globally,
    key: feed.id,
    parsing_error_count: feed.parsing_error_count,
    site_url: feed.site_url,
    title: feed.title,
  }))
})

const updateFeedStatus = (feed, isSuccessful, targetFeedId = null) => {
  if (targetFeedId === null || targetFeedId === feed.id) {
    return {
      ...feed,
      parsing_error_count: isSuccessful ? 0 : feed.parsing_error_count + 1,
      checked_at: getUTCDate(),
    }
  }
  return feed
}

const handleFeedRefresh = async (refreshFunc, feedUpdater, displayMessage = true) => {
  const { polyglot } = polyglotState.get()

  try {
    const response = await refreshFunc()
    const isSuccessful = response.status === 204

    if (displayMessage) {
      isSuccessful
        ? Message.success(polyglot.t("feed_table.refresh_success"))
        : Message.error(polyglot.t("feed_table.refresh_error"))
    }

    setFeedsData((feeds) => feeds.map((feed) => feedUpdater(feed, isSuccessful)))
    return isSuccessful
  } catch (error) {
    console.error("Failed to refresh feed: ", error)
    if (displayMessage) {
      Message.error(polyglot.t("feed_table.refresh_error"))
    }
    setFeedsData((feeds) => feeds.map((feed) => feedUpdater(feed, false)))
    return false
  }
}

const refreshSingleFeed = async (feed, displayMessage = true) => {
  const feedId = feed.id || feed.key
  return handleFeedRefresh(
    () => refreshFeed(feedId),
    (feed, isSuccessful) => updateFeedStatus(feed, isSuccessful, feedId),
    displayMessage,
  )
}

const RefreshModal = ({ visible, setVisible }) => {
  const { polyglot } = useStore(polyglotState)
  const filteredFeeds = useStore(filteredFeedsState)

  const refreshAllFeeds = async () => {
    setVisible(false)
    await handleFeedRefresh(refreshAllFeed, updateFeedStatus)
  }

  const refreshErrorFeeds = async () => {
    setVisible(false)
    const errorFeeds = filteredFeeds.filter((feed) => feed.parsing_error_count > 0)
    const id = "bulk-refresh-error-feeds"
    Message.loading({
      id,
      duration: 0,
      content: polyglot.t("feed_table.bulk_refresh_error_feeds_message"),
    })

    let successCount = 0
    let failureCount = 0

    for (const feed of errorFeeds) {
      const isSuccessful = await refreshSingleFeed(feed, false)
      if (isSuccessful) {
        successCount++
      } else {
        failureCount++
      }
      await sleep(500)
    }

    Message.success({
      id,
      content: polyglot.t("feed_table.bulk_refresh_error_feeds_result", {
        success: successCount,
        failure: failureCount,
      }),
    })
  }

  const closeModal = () => setVisible(false)

  return (
    <>
      <CustomTooltip mini content={polyglot.t("feed_table.refresh_feeds_tooltip")}>
        <Button
          icon={<IconRefresh />}
          shape="circle"
          size="small"
          onClick={() => setVisible(true)}
        />
      </CustomTooltip>
      <Modal
        className="edit-modal"
        title={polyglot.t("feed_table.refresh_feeds_title")}
        visible={visible}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            {polyglot.t("feed_table.refresh_feeds_cancel")}
          </Button>,
          <Button key="error" type="outline" onClick={refreshErrorFeeds}>
            {polyglot.t("feed_table.refresh_feeds_error")}
          </Button>,
          <Button key="all" type="primary" onClick={refreshAllFeeds}>
            {polyglot.t("feed_table.refresh_feeds_all")}
          </Button>,
        ]}
        onCancel={closeModal}
      >
        <p>{polyglot.t("feed_table.refresh_feeds_description")}</p>
      </Modal>
    </>
  )
}

const BulkUpdateModal = ({ visible, setVisible }) => {
  const { polyglot } = useStore(polyglotState)
  const filteredFeeds = useStore(filteredFeedsState)

  const [newHost, setNewHost] = useState("")

  const bulkUpdateFeedHosts = async () => {
    try {
      const updatedFeeds = await Promise.all(
        filteredFeeds.map(async (feed) => {
          const oldHost = new URL(feed.feed_url).hostname
          if (oldHost === newHost) {
            return feed
          }

          const newURL = feed.feed_url.replace(oldHost, newHost)
          const data = await updateFeed(feed.id, { feedUrl: newURL })
          return { ...feed, ...data }
        }),
      )

      const getUpdatedFeed = (feed, updatedFeeds) => {
        const updatedFeed = updatedFeeds.find((f) => f.id === feed.id)
        return updatedFeed || feed
      }
      setFeedsData((feeds) => feeds.map((feed) => getUpdatedFeed(feed, updatedFeeds)))

      Message.success(polyglot.t("feed_table.bulk_update_success"))
      setVisible(false)
    } catch (error) {
      console.error("Failed to bulk update feeds: ", error)
      Message.error(polyglot.t("feed_table.bulk_update_error"))
    }
  }

  return (
    <Modal
      className="edit-modal"
      title={polyglot.t("feed_table.modal_bulk_update_title")}
      visible={visible}
      onOk={bulkUpdateFeedHosts}
      onCancel={() => {
        setVisible(false)
        setNewHost("")
      }}
    >
      <Input
        placeholder="rsshub.app"
        value={newHost}
        prefix={
          <Tooltip content={polyglot.t("feed_table.modal_bulk_update_description")}>
            <IconQuestionCircle />
          </Tooltip>
        }
        onChange={(value) => setNewHost(value)}
      />
    </Modal>
  )
}

const EditFeedModal = ({ visible, setVisible, feedForm, selectedFeed }) => {
  const { polyglot } = useStore(polyglotState)
  const categories = useStore(categoriesState)

  const editFeed = async (feedId, newDetails) => {
    try {
      const data = await updateFeed(feedId, newDetails)
      setFeedsData((feeds) =>
        feeds.map((feed) => (feed.id === feedId ? { ...feed, ...data } : feed)),
      )
      Message.success(polyglot.t("feed_table.update_feed_success"))
      setVisible(false)
      feedForm.resetFields()
    } catch (error) {
      console.error("Failed to update feed: ", error)
      Message.error(polyglot.t("feed_table.update_feed_error"))
    }
  }

  return (
    <Modal
      unmountOnExit
      className="edit-modal"
      title={polyglot.t("feed_table.modal_edit_feed_title")}
      visible={visible}
      onOk={feedForm.submit}
      onCancel={() => {
        setVisible(false)
        feedForm.resetFields()
      }}
    >
      <Form
        form={feedForm}
        labelCol={{ span: 7 }}
        layout="vertical"
        wrapperCol={{ span: 17 }}
        onSubmit={async (values) => {
          const newDetails = {
            categoryId: values.category,
            title: values.title,
            siteUrl: values.siteUrl.trim(),
            feedUrl: values.feedUrl.trim(),
            hidden: values.hidden,
            disabled: values.disabled,
            isFullText: values.crawler,
          }
          if (newDetails.feedUrl) {
            await editFeed(selectedFeed.key, newDetails)
          } else {
            Message.error(polyglot.t("feed_table.modal_edit_feed_submit_error"))
          }
        }}
      >
        <Form.Item
          required
          field="category"
          label={polyglot.t("feed_table.modal_edit_feed_category_label")}
          rules={[{ required: true }]}
        >
          <Select>
            {categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          field="title"
          label={polyglot.t("feed_table.modal_edit_feed_title_label")}
          rules={[{ required: true }]}
        >
          <Input placeholder={polyglot.t("feed_table.modal_edit_feed_title_placeholder")} />
        </Form.Item>
        <Form.Item
          field="siteUrl"
          label={polyglot.t("feed_table.modal_edit_feed_site_url_label")}
          rules={[{ required: true }]}
        >
          <Input placeholder={polyglot.t("feed_table.modal_edit_feed_site_url_placeholder")} />
        </Form.Item>
        <Form.Item
          field="feedUrl"
          label={polyglot.t("feed_table.modal_edit_feed_feed_url_label")}
          rules={[{ required: true }]}
        >
          <Input placeholder={polyglot.t("feed_table.modal_edit_feed_feed_url_placeholder")} />
        </Form.Item>
        <Form.Item
          field="hidden"
          initialValue={selectedFeed.hidden}
          label={polyglot.t("feed_table.modal_edit_feed_hidden_label")}
          rules={[{ type: "boolean" }]}
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          field="disabled"
          initialValue={selectedFeed.disabled}
          label={polyglot.t("feed_table.modal_edit_feed_disabled_label")}
          rules={[{ type: "boolean" }]}
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          field="crawler"
          label={polyglot.t("feed_table.modal_edit_feed_crawler_label")}
          rules={[{ type: "boolean" }]}
          tooltip={<div>{polyglot.t("feed_table.modal_edit_feed_crawler_tooltip")}</div>}
          triggerPropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const FeedList = () => {
  const { isAppDataReady } = useStore(dataState)
  const { showDetailedRelativeTime } = useStore(settingsState)
  const filterType = useStore(filterTypeState)
  const tableData = useStore(tableDataState)
  const { polyglot } = useStore(polyglotState)
  const tooltipLines = polyglot.t("search.tooltip").split("\n")

  const [bulkUpdateModalVisible, setBulkUpdateModalVisible] = useState(false)
  const [refreshModalVisible, setRefreshModalVisible] = useState(false)
  const [editFeedModalVisible, setEditFeedModalVisible] = useState(false)
  const [feedForm] = Form.useForm()
  const [selectedFeed, setSelectedFeed] = useState(null)

  const { isBelowMedium } = useScreenWidth()

  const navigate = useNavigate()

  useEffect(() => {
    setFilterString("")
  }, [])

  const handleSelectFeed = (feed) => {
    setSelectedFeed(feed)
    setEditFeedModalVisible(true)
    feedForm.setFieldsValue({
      category: feed.category.id,
      title: feed.title,
      siteUrl: feed.site_url,
      feedUrl: feed.feed_url,
      hidden: feed.hidden,
      disabled: feed.disabled,
      crawler: feed.crawler,
    })
  }

  const removeFeed = async (feed) => {
    try {
      const response = await deleteFeed(feed.key)
      if (response.status === 204) {
        setFeedsData((feeds) => feeds.filter((f) => f.id !== feed.key))
        Message.success(polyglot.t("feed_table.remove_feed_success", { title: feed.title }))
      } else {
        Message.error(polyglot.t("feed_table.remove_feed_error", { title: feed.title }))
      }
    } catch (error) {
      console.error(`Failed to unfollow feed: ${feed.title}`, error)
      Message.error(polyglot.t("feed_table.remove_feed_error", { title: feed.title }))
    }
  }

  const columns = [
    {
      title: polyglot.t("feed_table.table_title"),
      dataIndex: "title",
      sorter: (a, b) => a.title.localeCompare(b.title, "en"),
      render: (title, feed) => {
        const parsingErrorCount = feed.parsing_error_count
        let displayText = feed.disabled ? `🚫 ${title}` : title
        if (parsingErrorCount > 0) {
          displayText = `⚠️ ${title}`
        }

        const tooltipContent = (
          <div>
            {title}
            {parsingErrorCount > 0 && (
              <>
                <br />
                ⚠️ Parsing error count: {parsingErrorCount}
              </>
            )}
          </div>
        )

        return (
          <Typography.Ellipsis expandable={false}>
            <CustomTooltip mini content={tooltipContent}>
              <CustomLink text={displayText} url={`/feed/${feed.key}`} />
            </CustomTooltip>
          </Typography.Ellipsis>
        )
      },
    },

    !isBelowMedium && {
      title: polyglot.t("feed_table.table_url"),
      dataIndex: "feed_url",
      sorter: (a, b) => a.feed_url.localeCompare(b.feed_url, "en"),
      render: (feedUrl) => (
        <Typography.Ellipsis expandable={false} showTooltip={true}>
          {feedUrl}
        </Typography.Ellipsis>
      ),
    },

    {
      title: polyglot.t("feed_table.table_category"),
      dataIndex: "category.title",
      sorter: (a, b) => a.category.title.localeCompare(b.category.title, "en"),
      render: (category, feed) => (
        <Typography.Ellipsis expandable={false} showTooltip={!isBelowMedium}>
          <Tag
            size="small"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/category/${feed.category.id}`)}
          >
            {category}
          </Tag>
        </Typography.Ellipsis>
      ),
    },

    !isBelowMedium && {
      title: polyglot.t("feed_table.table_checked_at"),
      dataIndex: "checked_at",
      sorter: (a, b) => a.checked_at.localeCompare(b.checked_at, "en"),
      render: (checkedAt) => (
        <Typography.Ellipsis expandable={false}>
          {generateRelativeTime(checkedAt, showDetailedRelativeTime)}
        </Typography.Ellipsis>
      ),
    },

    {
      title: polyglot.t("feed_table.table_actions"),
      dataIndex: "op",
      fixed: "right",
      width: 100,
      render: (_col, record) => (
        <Space style={{ marginLeft: -10 }}>
          <CustomTooltip mini content={polyglot.t("feed_table.table_feed_edit_tooltip")}>
            <Button
              icon={<IconEdit />}
              shape="circle"
              size="mini"
              onClick={() => handleSelectFeed(record)}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("feed_table.table_feed_refresh_tooltip")}>
            <Button
              icon={<IconRefresh />}
              shape="circle"
              size="mini"
              onClick={() => refreshSingleFeed(record)}
            />
          </CustomTooltip>
          <Popconfirm
            focusLock
            position="left"
            title={polyglot.t("feed_table.table_feed_remove_confirm")}
            onOk={() => removeFeed(record)}
          >
            <CustomTooltip mini content={polyglot.t("feed_table.table_feed_remove_tooltip")}>
              <Button icon={<IconDelete />} shape="circle" size="mini" />
            </CustomTooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(Boolean)

  const [pagination, setPagination] = useState({
    showJumper: true,
    showTotal: true,
    total: tableData.length,
    pageSize: 15,
    current: 1,
    sizeCanChange: false,
  })

  const handleTableChange = (pagination) => {
    setPagination((prev) => ({
      ...prev,
      current: pagination.current,
    }))
  }

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: tableData.length,
    }))
  }, [tableData.length])

  return (
    <>
      <div className="feed-table-action-bar">
        <div
          style={{
            display: "flex",
            flex: 1,
            justifyContent: "left",
            minWidth: 0,
          }}
        >
          <Input.Search
            allowClear
            className="search-input"
            placeholder={polyglot.t("search.placeholder")}
            addBefore={
              <Select
                style={{ width: 80 }}
                value={filterType}
                triggerProps={{
                  autoAlignPopupWidth: false,
                  autoAlignPopupMinWidth: true,
                  position: "bl",
                }}
                onChange={setFilterType}
              >
                <Select.Option value="title">{polyglot.t("search.type_title")}</Select.Option>
                <Select.Option value="feed_url">{polyglot.t("search.type_feed_url")}</Select.Option>
                <Select.Option value="site_url">{polyglot.t("search.type_site_url")}</Select.Option>
              </Select>
            }
            prefix={
              <Tooltip
                mini
                position="bottom"
                content={
                  <div>
                    {tooltipLines.map((line, index) => (
                      <Fragment key={`line-${index}-${line.length}`}>
                        {line}
                        {index < tooltipLines.length - 1 && <br />}
                      </Fragment>
                    ))}
                  </div>
                }
              >
                <IconQuestionCircle />
              </Tooltip>
            }
            onChange={setFilterString}
          />
        </div>
        <div className="button-group">
          <CustomTooltip mini content={polyglot.t("feed_table.table_feed_bulk_update_tooltip")}>
            <Button
              icon={<IconEdit />}
              shape="circle"
              size="small"
              onClick={() => setBulkUpdateModalVisible(true)}
            />
          </CustomTooltip>
          <BulkUpdateModal
            setVisible={setBulkUpdateModalVisible}
            visible={bulkUpdateModalVisible}
          />
          <RefreshModal setVisible={setRefreshModalVisible} visible={refreshModalVisible} />
        </div>
      </div>
      <Table
        borderCell={true}
        className="feed-table"
        columns={columns}
        data={tableData}
        loading={!isAppDataReady}
        pagination={pagination}
        scroll={{ x: true }}
        size="small"
        renderPagination={(paginationNode) => (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 10,
            }}
          >
            {paginationNode}
          </div>
        )}
        onChange={handleTableChange}
      />
      {selectedFeed && (
        <EditFeedModal
          feedForm={feedForm}
          selectedFeed={selectedFeed}
          setVisible={setEditFeedModalVisible}
          visible={editFeedModalVisible}
        />
      )}
    </>
  )
}

export default FeedList
