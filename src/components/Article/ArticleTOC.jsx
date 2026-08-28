import { Button, Dropdown, Input, Menu, Typography } from "@arco-design/web-react"
import { IconArrowLeft, IconUnorderedList } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useState } from "react"
import SimpleBar from "simplebar-react"

import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { articleHeadingsState } from "@/store/contentState"
import { scrollToHeading } from "@/utils/dom"
import { includesIgnoreCase } from "@/utils/filter"
import "./ArticleTOC.css"

const ArticleTOCPanel = ({ onBack, onClose }) => {
  const headings = useStore(articleHeadingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()
  const filterLabel = polyglot.t("article_toc.filter_headings") || "Filter headings"
  const [filterValue, setFilterValue] = useState("")
  const isFilterVisible = Boolean(onBack) || isBelowMedium

  const filteredHeadings = isFilterVisible
    ? headings.filter((heading) => includesIgnoreCase(heading.text, filterValue))
    : headings

  const handleHeadingClick = (heading) => {
    scrollToHeading(heading)
    onClose()
  }

  return (
    <div className="toc-droplist-container">
      {isFilterVisible && (
        <div className={`toc-filter-container${onBack ? " toc-filter-container-with-back" : ""}`}>
          {onBack && (
            <Button
              aria-label={polyglot.t("article_toc.back_to_actions") || "Back to more actions"}
              className="toc-back-button"
              icon={<IconArrowLeft aria-hidden="true" />}
              shape="circle"
              type="text"
              onClick={onBack}
            />
          )}
          <Input
            allowClear
            aria-label={filterLabel}
            autoFocus={Boolean(onBack)}
            placeholder={filterLabel}
            style={{ width: "100%", marginBottom: "8px" }}
            value={filterValue}
            onChange={setFilterValue}
          />
        </div>
      )}
      <SimpleBar className="toc-menu-container">
        <Menu>
          {filteredHeadings.map((heading) => (
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
  )
}

const ArticleTOC = () => {
  const headings = useStore(articleHeadingsState)
  const { polyglot } = useStore(polyglotState)
  const label = polyglot.t("article_toc.tooltip") || "Table of Contents"
  const [dropdownVisible, setDropdownVisible] = useState(false)

  if (headings.length === 0) {
    return null
  }

  return (
    <Dropdown
      droplist={<ArticleTOCPanel onClose={() => setDropdownVisible(false)} />}
      popupVisible={dropdownVisible}
      position="br"
      trigger="click"
      triggerProps={{
        boundaryDistance: { bottom: 8, left: 8, right: 8, top: 8 },
        className: "toc-dropdown",
      }}
      onVisibleChange={setDropdownVisible}
    >
      <CustomTooltip mini content={label}>
        <Button aria-label={label} icon={<IconUnorderedList aria-hidden="true" />} shape="circle" />
      </CustomTooltip>
    </Dropdown>
  )
}

export { ArticleTOCPanel }
export default memo(ArticleTOC)
