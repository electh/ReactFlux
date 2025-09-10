import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "@arco-design/web-react"
import { IconDelete, IconEdit, IconQuestionCircle, IconRefresh } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { atom, computed } from "nanostores"
import { Fragment, useEffect, useState } from "react"
import { useNavigate } from "react-router"

import { refreshAllFeed, updateFeed } from "@/apis"
import CustomLink from "@/components/ui/CustomLink"
import CustomTooltip from "@/components/ui/CustomTooltip"
import EditFeedModal from "@/components/ui/EditFeedModal"
import { handleFeedRefresh, updateFeedStatus, useFeedOperations } from "@/hooks/useFeedOperations"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { dataState, setFeedsData } from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import { generateRelativeTime } from "@/utils/date"
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
    const sortedFeeds = [...feedsData]
      .sort((a, b) => {
        if (a.disabled !== b.disabled) {
          return a.disabled ? 1 : -1
        }
        return 0
      })
      .sort((a, b) => b.parsing_error_count - a.parsing_error_count)

    return filterString ? filterByQuery(sortedFeeds, filterString, [filterType]) : sortedFeeds
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

const RefreshModal = ({ visible, setVisible }) => {
  const { polyglot } = useStore(polyglotState)
  const filteredFeeds = useStore(filteredFeedsState)

  const { refreshSingleFeed } = useFeedOperations(false)

  const refreshAllFeeds = async () => {
    setVisible(false)
    await handleFeedRefresh(refreshAllFeed, updateFeedStatus, true, false)
  }

  const refreshErrorFeeds = async () => {
    setVisible(false)
    const feedsWithErrors = filteredFeeds.filter((feed) => feed.parsing_error_count > 0)
    const messageId = "bulk-refresh-error-feeds"
    Message.loading({
      id: messageId,
      duration: 0,
      content: polyglot.t("feed_table.bulk_refresh_error_feeds_message"),
    })

    let successCount = 0
    let failureCount = 0

    for (const feed of feedsWithErrors) {
      const isSuccessful = await refreshSingleFeed(feed, false)
      isSuccessful ? successCount++ : failureCount++
      await sleep(500)
    }

    Message.success({
      id: messageId,
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

const BulkOperationsModal = ({ visible, setVisible, selectedFeeds, onComplete }) => {
  const { polyglot } = useStore(polyglotState)
  const { categoriesData } = useStore(dataState)

  const [operationType, setOperationType] = useState("")
  const [newCategoryId, setNewCategoryId] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [loading, setLoading] = useState(false)

  const handleBulkOperation = async () => {
    if (!operationType) {
      return
    }

    setLoading(true)
    try {
      let updateData = null

      if (operationType === "category" && newCategoryId) {
        updateData = { categoryId: Number(newCategoryId) }
      } else if (operationType === "status" && newStatus) {
        const statusUpdateMap = {
          hide: { hidden: true },
          show: { hidden: false },
          disable: { disabled: true },
          enable: { disabled: false },
        }
        updateData = statusUpdateMap[newStatus]
      }

      if (!updateData) {
        return
      }

      const updatedFeeds = await Promise.all(
        selectedFeeds.map(async (feed) => {
          const data = await updateFeed(feed.key, updateData)
          return { ...feed, ...data }
        }),
      )

      setFeedsData((feeds) =>
        feeds.map((feed) => {
          const updatedFeed = updatedFeeds.find((f) => f.id === feed.id)
          return updatedFeed || feed
        }),
      )

      Message.success(polyglot.t("feed_table.bulk_operation_success"))
      onComplete()
      setVisible(false)
    } catch (error) {
      console.error("Failed to bulk update feeds:", error)
      Message.error(polyglot.t("feed_table.bulk_operation_error"))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setOperationType("")
    setNewCategoryId("")
    setNewStatus("")
    setLoading(false)
  }

  const handleCancel = () => {
    setVisible(false)
    resetForm()
  }

  return (
    <Modal
      className="edit-modal"
      confirmLoading={loading}
      title={polyglot.t("feed_table.bulk_operations_title")}
      visible={visible}
      onCancel={handleCancel}
      onOk={handleBulkOperation}
    >
      <div style={{ marginBottom: 16 }}>
        <p>{polyglot.t("feed_table.bulk_operations_selected", { count: selectedFeeds.length })}</p>
      </div>

      <Form.Item label={polyglot.t("feed_table.bulk_operations_type")}>
        <Select
          value={operationType}
          onChange={(value) => {
            setOperationType(value)
            setNewCategoryId("")
            setNewStatus("")
          }}
        >
          <Select.Option value="category">
            {polyglot.t("feed_table.bulk_operations_change_category")}
          </Select.Option>
          <Select.Option value="status">
            {polyglot.t("feed_table.bulk_operations_change_status")}
          </Select.Option>
        </Select>
      </Form.Item>

      {operationType === "category" && (
        <Form.Item label={polyglot.t("feed_table.bulk_operations_new_category")}>
          <Select
            placeholder={polyglot.t("feed_table.bulk_operations_select_category")}
            value={newCategoryId}
            onChange={setNewCategoryId}
          >
            {categoriesData.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {operationType === "status" && (
        <Form.Item label={polyglot.t("feed_table.bulk_operations_new_status")}>
          <Select
            placeholder={polyglot.t("feed_table.bulk_operations_select_status")}
            value={newStatus}
            onChange={setNewStatus}
          >
            <Select.Option value="hide">
              {polyglot.t("feed_table.bulk_operations_hide")}
            </Select.Option>
            <Select.Option value="show">
              {polyglot.t("feed_table.bulk_operations_show")}
            </Select.Option>
            <Select.Option value="disable">
              {polyglot.t("feed_table.bulk_operations_disable")}
            </Select.Option>
            <Select.Option value="enable">
              {polyglot.t("feed_table.bulk_operations_enable")}
            </Select.Option>
          </Select>
        </Form.Item>
      )}
    </Modal>
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

      setFeedsData((feeds) =>
        feeds.map((feed) => {
          const updatedFeed = updatedFeeds.find((f) => f.id === feed.id)
          return updatedFeed || feed
        }),
      )

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

const FeedList = () => {
  const { isCoreDataReady } = useStore(dataState)
  const { showDetailedRelativeTime } = useStore(settingsState)
  const filterType = useStore(filterTypeState)
  const tableData = useStore(tableDataState)
  const { polyglot } = useStore(polyglotState)
  const tooltipLines = polyglot.t("search.tooltip").split("\n")

  const [bulkUpdateModalVisible, setBulkUpdateModalVisible] = useState(false)
  const [bulkOperationsModalVisible, setBulkOperationsModalVisible] = useState(false)
  const [refreshModalVisible, setRefreshModalVisible] = useState(false)
  const [editFeedModalVisible, setEditFeedModalVisible] = useState(false)
  const [feedForm] = Form.useForm()
  const [selectedFeed, setSelectedFeed] = useState(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  const { isBelowMedium } = useScreenWidth()
  const { refreshSingleFeed, handleDeleteFeed } = useFeedOperations(false)

  const navigate = useNavigate()

  useEffect(() => {
    setFilterString("")
  }, [])

  const getSelectedFeeds = () => tableData.filter((feed) => selectedRowKeys.includes(feed.key))

  const handleBulkOperationsComplete = () => {
    setSelectedRowKeys([])
  }

  const handleSelectFeed = (feed) => {
    setSelectedFeed(feed)
    setEditFeedModalVisible(true)
    feedForm.setFieldsValue({
      categoryId: feed.category.id,
      title: feed.title,
      siteUrl: feed.site_url,
      feedUrl: feed.feed_url,
      hidden: feed.hidden,
      disabled: feed.disabled,
      crawler: feed.crawler,
    })
  }

  const columns = [
    {
      title: polyglot.t("feed_table.table_title"),
      dataIndex: "title",
      sorter: (a, b) => a.title.localeCompare(b.title, "en"),
      render: (title, feed) => {
        const { parsing_error_count: errorCount, disabled, key } = feed

        let displayText = title
        if (errorCount > 0) {
          displayText = `⚠️ ${title}`
        } else if (disabled) {
          displayText = `🚫 ${title}`
        }

        const tooltipContent = (
          <div>
            {title}
            {errorCount > 0 && (
              <>
                <br />
                ⚠️ Parsing error count: {errorCount}
              </>
            )}
          </div>
        )

        return (
          <Typography.Ellipsis expandable={false}>
            <CustomTooltip mini content={tooltipContent}>
              <CustomLink text={displayText} url={`/feed/${key}`} />
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
        <Typography.Ellipsis showTooltip expandable={false}>
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
      render: (_, record) => (
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
          <CustomTooltip mini content={polyglot.t("feed_table.table_feed_remove_tooltip")}>
            <Button
              icon={<IconDelete />}
              shape="circle"
              size="mini"
              onClick={() => handleDeleteFeed(record)}
            />
          </CustomTooltip>
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
                style={{ width: "auto" }}
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
          <CustomTooltip mini content={polyglot.t("feed_table.bulk_operations_tooltip")}>
            <Button
              disabled={selectedRowKeys.length === 0}
              size="small"
              type={selectedRowKeys.length > 0 ? "primary" : "default"}
              onClick={() => setBulkOperationsModalVisible(true)}
            >
              {polyglot.t("feed_table.bulk_operations")}
              {selectedRowKeys.length > 0 && ` (${selectedRowKeys.length})`}
            </Button>
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("feed_table.table_feed_bulk_update_tooltip")}>
            <Button
              icon={<IconEdit />}
              shape="circle"
              size="small"
              onClick={() => setBulkUpdateModalVisible(true)}
            />
          </CustomTooltip>
          <BulkOperationsModal
            selectedFeeds={getSelectedFeeds()}
            setVisible={setBulkOperationsModalVisible}
            visible={bulkOperationsModalVisible}
            onComplete={handleBulkOperationsComplete}
          />
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
        loading={!isCoreDataReady}
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
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          checkCrossPage: true,
        }}
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
