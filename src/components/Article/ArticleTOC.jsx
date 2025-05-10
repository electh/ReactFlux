import { Button, Dropdown, Input, Menu, Typography } from "@arco-design/web-react"
import { IconUnorderedList } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useState } from "react"
import SimpleBar from "simplebar-react"

import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import { articleHeadingsState } from "@/store/contentState"
import { scrollToHeading } from "@/utils/dom"
import { includesIgnoreCase } from "@/utils/filter"
import "./ArticleTOC.css"

const ArticleTOC = () => {
  const headings = useStore(articleHeadingsState)
  const { polyglot } = useStore(polyglotState)

  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [filterValue, setFilterValue] = useState("")

  const filteredHeadings = headings.filter((heading) =>
    includesIgnoreCase(heading.text, filterValue),
  )

  const handleFilterChange = (value) => {
    setFilterValue(value)
  }

  const handleHeadingClick = (heading) => {
    scrollToHeading(heading)
    setDropdownVisible(false)
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <Dropdown
      popupVisible={dropdownVisible}
      position="br"
      trigger="click"
      triggerProps={{ className: "toc-dropdown" }}
      droplist={
        <div className="toc-droplist-container">
          <div className="toc-filter-container">
            <Input
              allowClear
              placeholder={polyglot.t("article_toc.filter_headings") || "Filter headings"}
              style={{ width: "100%", marginBottom: "8px" }}
              value={filterValue}
              onChange={handleFilterChange}
            />
          </div>
          <SimpleBar className="toc-menu-container">
            <Menu>
              {filteredHeadings.length > 0 &&
                filteredHeadings.map((heading) => (
                  <Menu.Item key={heading.id} onClick={() => handleHeadingClick(heading)}>
                    <div
                      className="toc-menu-item"
                      style={{ paddingLeft: `${(heading.level - 1) * 8}px` }}
                    >
                      <Typography.Ellipsis showTooltip expandable={false}>
                        {heading.text}
                      </Typography.Ellipsis>
                    </div>
                  </Menu.Item>
                ))}
            </Menu>
          </SimpleBar>
        </div>
      }
      onVisibleChange={setDropdownVisible}
    >
      <CustomTooltip mini content={polyglot.t("article_toc.tooltip") || "Table of Contents"}>
        <Button icon={<IconUnorderedList />} shape="circle" />
      </CustomTooltip>
    </Dropdown>
  )
}

export default memo(ArticleTOC)
