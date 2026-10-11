import { Button, Input, Radio } from "@arco-design/web-react"
import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom/client"

import "@arco-design/web-react/dist/css/arco.css"
import "@/App.css"
import "@/components/Article/ActionButtons.css"
import "@/components/Article/ArticleDetail.css"
import "@/components/Article/SearchAndSortBar.css"
import "@/components/Content/Content.css"
import "@/components/Content/FooterPanel.css"
import AccessibleModal from "@/components/ui/AccessibleModal"
import AdaptiveScrollArea from "@/components/ui/AdaptiveScrollArea"
import FadeTransition from "@/components/ui/FadeTransition"
import "@/theme.css"
import "@/liquid-glass.css"
import "./phase2b2b-liquid-glass.css"

const samplePhoto = new URL("../../src/pages/images/background.jpg", import.meta.url).href

const ARTICLE_TITLE_VARIANTS = {
  centeredMetadata: {
    alignment: "center",
    metadata: true,
    title:
      "A longer headline demonstrates the initial title clearance while the article actions stay above the reader",
  },
  leftMetadata: {
    alignment: "left",
    metadata: true,
    title:
      "A longer headline demonstrates the initial title clearance while the article actions stay above the reader",
  },
  centeredMinimal: {
    alignment: "center",
    metadata: false,
    title: "A concise one-line headline",
  },
  leftMinimal: {
    alignment: "left",
    metadata: false,
    title: "A concise one-line headline",
  },
}

const ArticleBody = () => (
  <article className="demo-opaque-content">
    <p className="demo-kicker">EDITORIAL / DESIGN</p>
    <h2>Chrome should stay legible while stories remain the focus</h2>
    <p>
      The navigation controls use a restrained tinted surface above the page. The article itself
      keeps an opaque reading surface, with steady contrast in dark and light themes.
    </p>
    <p>
      Interactions use short state layers for hover and press. Focus stays visible independently of
      translucency, and the reduced-transparency mode replaces blur with a solid token surface.
    </p>
  </article>
)

const ImageSample = ({ tone = "high", underlayTarget }) => (
  <figure
    aria-label={`${tone} contrast image sample`}
    className={`demo-image demo-image-${tone}`}
    data-underlay-target={underlayTarget}
  >
    <img alt="" src={samplePhoto} />
    {!underlayTarget && (
      <Button
        aria-label="Open image preview"
        className="nf-glass-control demo-overlay-control"
        shape="circle"
      >
        ⤢
      </Button>
    )}
    <figcaption className="demo-image-caption">{tone.toUpperCase()} CONTRAST / IMAGE</figcaption>
  </figure>
)

const SurfaceComparison = () => (
  <section aria-label="Opaque and glass control comparison" className="demo-material-comparison">
    <div className="demo-comparison-copy">
      <span className="demo-kicker">SAME CONTROL / SAME FLAT BACKDROP</span>
      <p>
        Opaque means no glass fill or backdrop filter. It preserves the surface color without adding
        a gray card.
      </p>
    </div>
    <div className="demo-comparison-samples">
      <div className="demo-comparison-sample">
        <Button
          aria-label="Opaque control"
          className="demo-comparison-control demo-opaque-control"
          shape="circle"
        >
          ◉
        </Button>
        <span>OPAQUE_CONTROL</span>
      </div>
      <div className="demo-comparison-sample">
        <Button
          aria-label="Glass control"
          className="demo-comparison-control nf-glass-control"
          shape="circle"
        >
          ◉
        </Button>
        <span>GLASS_CONTROL</span>
      </div>
    </div>
  </section>
)

const MaterialSamples = () => (
  <section aria-label="Glass over different backgrounds" className="demo-material-grid">
    <div className="demo-material-sample demo-flat-material">
      <span className="demo-kicker">FLAT NEAR-BLACK CANVAS</span>
      <Button
        aria-label="Glass over flat canvas"
        className="nf-glass-control demo-sample-control"
        shape="circle"
      >
        ◌
      </Button>
    </div>
    <div className="demo-material-sample demo-text-material">
      <span className="demo-kicker">ARTICLE TEXT</span>
      <p>
        The controls stay legible above an article while the words behind the surface soften with
        the backdrop. The reading surface remains opaque.
      </p>
      <Button
        aria-label="Glass over article text"
        className="nf-glass-control demo-sample-control"
        shape="circle"
      >
        ⋯
      </Button>
    </div>
    <ImageSample tone="high" />
    <ImageSample tone="low" />
  </section>
)

const ControlPill = ({ filterValue, onChange }) => (
  <Radio.Group
    className="nf-glass-group entry-panel-filter-group demo-control-pill"
    type="button"
    value={filterValue}
    onChange={onChange}
  >
    <Radio value="all">All</Radio>
    <Radio value="unread">Unread</Radio>
    <Radio value="starred">Starred</Radio>
  </Radio.Group>
)

const ActionGroup = ({ children, className = "" }) => (
  <div
    aria-label="Article actions"
    className={`nf-glass-group demo-action-group ${className}`}
    role="group"
  >
    {children}
  </div>
)

const ActionButtonsPreview = () => (
  <>
    <div className="action-buttons demo-desktop-actions">
      <ActionGroup className="left-side">
        <Button aria-label="Close article" shape="circle">
          ×
        </Button>
        <Button aria-label="Previous article" shape="circle">
          ‹
        </Button>
        <Button aria-label="Next article" shape="circle">
          ›
        </Button>
      </ActionGroup>
      <ActionGroup className="right-side">
        <Button aria-label="Mark as read" shape="circle">
          ◉
        </Button>
        <Button aria-label="Add favorite" shape="circle">
          ☆
        </Button>
        <Button aria-label="Open original article" shape="circle">
          ↗
        </Button>
        <Button aria-label="More actions" shape="circle">
          ⋯
        </Button>
      </ActionGroup>
    </div>
    <div className="action-buttons mobile demo-mobile-actions">
      <div className="mobile-buttons nf-glass-group demo-action-group">
        <Button aria-label="Mark as read" shape="circle">
          ◉
        </Button>
        <Button aria-label="Add favorite" shape="circle">
          ☆
        </Button>
        <Button aria-label="Previous article" shape="circle">
          ‹
        </Button>
        <Button aria-label="Close article" shape="circle">
          ×
        </Button>
        <Button aria-label="Next article" shape="circle">
          ›
        </Button>
        <Button aria-label="More actions" shape="circle">
          ⋯
        </Button>
      </div>
    </div>
  </>
)

const ListView = ({
  activeControl,
  filterValue,
  onActiveSelect,
  onFilterChange,
  onSearchOpen,
  searchModalVisible,
}) => (
  <>
    <section aria-label="List controls" className="demo-list-toolbar">
      <Button
        aria-expanded={searchModalVisible}
        aria-haspopup="dialog"
        aria-label="Search"
        aria-pressed={activeControl === "search"}
        className={`nf-glass-control${activeControl === "search" ? " nf-glass-control-active" : ""}`}
        shape="circle"
        onClick={onSearchOpen}
      >
        ⌕
      </Button>
      <Button
        aria-label="Filter by date"
        aria-pressed={activeControl === "date"}
        className={`nf-glass-control${activeControl === "date" ? " nf-glass-control-active" : ""}`}
        shape="circle"
        onClick={() => onActiveSelect("date")}
      >
        ▦
      </Button>
      <Button aria-label="Sort articles" className="nf-glass-control" shape="circle">
        ↕
      </Button>
      <Button disabled aria-label="Disabled example" className="nf-glass-control" shape="circle">
        ⊘
      </Button>
    </section>
    <div className="demo-content-grid">
      <ArticleBody />
      <section className="demo-opaque-content demo-text-overlay">
        <span className="demo-kicker">FLOATING CONTROL / TEXT</span>
        <p>
          A contextual action can sit above readable text without tinting the article body or
          turning the whole reading surface into a translucent panel.
        </p>
        <Button
          aria-label="Open story actions"
          className="nf-glass-control demo-overlay-control"
          shape="circle"
        >
          ⋯
        </Button>
      </section>
      <ImageSample />
      <section className="demo-opaque-content demo-menu-candidate">
        <span className="demo-kicker">MENU / POPOVER CANDIDATE</span>
        <div className="demo-opaque-menu">
          <span>Open original article</span>
          <span>Share story</span>
          <span>Table of contents</span>
        </div>
      </section>
    </div>
    <footer className="entry-panel demo-filter-row">
      <span className="demo-kicker">LIST FILTERS</span>
      <ControlPill filterValue={filterValue} onChange={onFilterChange} />
    </footer>
  </>
)

const SearchModalPreview = ({ visible, onClose }) => (
  <AccessibleModal
    className="search-modal"
    closeLabel="Close search dialog"
    title="Search"
    visible={visible}
    footer={
      <>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="primary" onClick={onClose}>
          Search
        </Button>
      </>
    }
    onCancel={onClose}
  >
    <div className="search-modal-content">
      <Input.Search aria-label="Search articles" placeholder="Search articles" />
    </div>
  </AccessibleModal>
)

const DetailView = ({
  scrollAreaRef,
  titleVariant,
  onTitleVariantChange,
  scrollPreviewRef,
  scrollStatusRef,
}) => {
  const variant = ARTICLE_TITLE_VARIANTS[titleVariant]

  return (
    <>
      <div className="demo-detail-tools">
        <label className="demo-title-variant">
          Article header example
          <select
            value={titleVariant}
            onChange={(event) => onTitleVariantChange(event.target.value)}
          >
            <option value="centeredMetadata">Centered / metadata / multiline</option>
            <option value="leftMetadata">Left / metadata / multiline</option>
            <option value="centeredMinimal">Centered / no optional metadata / one line</option>
            <option value="leftMinimal">Left / no optional metadata / one line</option>
          </select>
        </label>
        <span>Scroll the article to move text and images behind the action groups.</span>
      </div>
      <section
        ref={scrollPreviewRef}
        aria-label="Scrollable article with sticky actions"
        className="article-container article-container-full-size demo-detail-layout"
        data-gate="article-chrome-shares-the-real-scroll-context"
      >
        <article className="article-content demo-reader-content">
          <AdaptiveScrollArea
            ref={scrollAreaRef}
            className="scroll-container demo-reader-scroll"
            scrollableNodeProps={{ tabIndex: -1 }}
          >
            <ActionButtonsPreview />
            <FadeTransition>
              <>
                <header
                  className="article-header demo-reader-header"
                  data-underlay-target="header"
                  style={{ textAlign: variant.alignment }}
                >
                  <span className="demo-kicker">ARTICLE HEADER / INITIAL CLEARANCE</span>
                  <h2 className="article-title">{variant.title}</h2>
                  {variant.metadata && (
                    <div className="article-meta">
                      <span>ReactFlux Design Notes</span>
                      <span> · Editorial</span>
                      <time>October 11, 2026</time>
                    </div>
                  )}
                  <p className="demo-reading-time">6 min read</p>
                </header>
                <div className="article-body demo-reader-body">
                  <p data-underlay-target="text">
                    The article text moves through the same scroll viewport as the sticky action
                    groups. Keep scrolling until this paragraph reaches the glass controls; the
                    words should remain visible and soften through the backdrop.
                  </p>
                  <p>
                    This second paragraph provides more letterforms and varied line lengths for the
                    text underlay check. The editorial surface stays opaque while the action groups
                    sample what moves beneath them.
                  </p>
                  <ImageSample tone="high" underlayTarget="image-high" />
                  <p>
                    After the high-contrast image, keep scrolling to bring the low-contrast image
                    beneath the action groups. The same sticky chrome remains in place while the
                    backdrop changes with the article content.
                  </p>
                  <ImageSample tone="low" underlayTarget="image-low" />
                  <p>
                    Repeated body copy confirms that the reader continues beyond the initial
                    clearance. The action controls should not reserve a toolbar-height gap through
                    the entire article.
                  </p>
                  <p>
                    Scroll back to the top to verify that the headline and metadata clear the
                    controls. Then select the centered and left-aligned title examples above.
                  </p>
                </div>
              </>
            </FadeTransition>
          </AdaptiveScrollArea>
        </article>
      </section>
      <output ref={scrollStatusRef} aria-live="polite" className="demo-scroll-status">
        Waiting for article scroll measurements.
      </output>
    </>
  )
}

const Harness = () => {
  const [theme, setTheme] = useState("dark")
  const [reducedTransparency, setReducedTransparency] = useState(false)
  const [safeAreaSimulation, setSafeAreaSimulation] = useState(false)
  const [view, setView] = useState("list")
  const [filterValue, setFilterValue] = useState("all")
  const [activeControl, setActiveControl] = useState(null)
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [titleVariant, setTitleVariant] = useState("centeredMetadata")
  const articleScrollAreaRef = useRef(null)
  const articlePreviewRef = useRef(null)
  const scrollStatusRef = useRef(null)

  useEffect(() => {
    if (theme === "dark") {
      document.body.setAttribute("arco-theme", "dark")
    } else {
      document.body.removeAttribute("arco-theme")
    }
  }, [theme])

  useEffect(() => {
    if (view !== "article") {
      return
    }

    const scrollElement = articleScrollAreaRef.current?.getScrollElement()
    const previewElement = articlePreviewRef.current
    if (!scrollElement || !previewElement) {
      return
    }

    let animationFrame = 0
    const updateScrollEvidence = () => {
      if (animationFrame) {
        return
      }

      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0
        const { scrollTop } = scrollElement
        const scrollRootRect = scrollElement.getBoundingClientRect()
        const toolbar = [...scrollElement.querySelectorAll(".action-buttons")].find(
          (element) => getComputedStyle(element).display !== "none",
        )
        const toolbarRect = toolbar?.getBoundingClientRect()
        let stickyScrollElement = toolbar?.parentElement
        while (stickyScrollElement && stickyScrollElement !== previewElement) {
          const { overflowY } = getComputedStyle(stickyScrollElement)
          if (["auto", "scroll", "hidden", "overlay"].includes(overflowY)) {
            break
          }
          stickyScrollElement = stickyScrollElement.parentElement
        }
        const glassGroups = [...(toolbar?.querySelectorAll(".nf-glass-group") ?? [])].filter(
          (element) => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          },
        )
        const header = scrollElement.querySelector(".demo-reader-header")
        const headerTop = header?.getBoundingClientRect().top ?? 0
        if (scrollTop === 0 && header) {
          previewElement.dataset.initialHeaderTop = String(headerTop)
        }
        const initialTop = Number(previewElement.dataset.initialHeaderTop)
        const intersectsGlass = (target) => {
          const targetRect = target?.getBoundingClientRect()
          if (!targetRect) {
            return false
          }
          return glassGroups.some((group) => {
            const groupRect = group.getBoundingClientRect()
            return (
              targetRect.left < groupRect.right &&
              targetRect.right > groupRect.left &&
              targetRect.top < groupRect.bottom &&
              targetRect.bottom > groupRect.top
            )
          })
        }
        const textUnderGlass = intersectsGlass(
          scrollElement.querySelector('[data-underlay-target="text"]'),
        )
        const highImageUnderGlass = intersectsGlass(
          scrollElement.querySelector('[data-underlay-target="image-high"]'),
        )
        const lowImageUnderGlass = intersectsGlass(
          scrollElement.querySelector('[data-underlay-target="image-low"]'),
        )
        const sample = textUnderGlass
          ? "text"
          : highImageUnderGlass
            ? "image-high"
            : lowImageUnderGlass
              ? "image-low"
              : "none"
        const toolbarPinned =
          Boolean(toolbarRect) && Math.abs(toolbarRect.top - scrollRootRect.top) <= 1
        const backdropFilter = glassGroups[0]
          ? getComputedStyle(glassGroups[0]).backdropFilter
          : "unavailable"

        previewElement.dataset.scrollOwner = scrollElement.dataset.nativeScroll
          ? "native"
          : "simplebar-content-wrapper"
        previewElement.dataset.stickyScrollOwner = stickyScrollElement?.classList.contains(
          "simplebar-content-wrapper",
        )
          ? "simplebar-content-wrapper"
          : stickyScrollElement?.dataset.nativeScroll
            ? "native"
            : "other"
        previewElement.dataset.stickySharesScrollOwner = String(
          stickyScrollElement === scrollElement,
        )
        previewElement.dataset.articleScrollTop = String(Math.round(scrollTop))
        previewElement.dataset.toolbarPinned = String(toolbarPinned)
        previewElement.dataset.textUnderGlass = String(textUnderGlass)
        previewElement.dataset.highImageUnderGlass = String(highImageUnderGlass)
        previewElement.dataset.lowImageUnderGlass = String(lowImageUnderGlass)
        previewElement.dataset.backdropSample = sample
        previewElement.dataset.backdropFilter = backdropFilter
        previewElement.dataset.initialTitleClearance = String(
          scrollTop === 0 && Boolean(toolbarRect) && headerTop >= toolbarRect.bottom,
        )
        previewElement.dataset.clearanceScrollsAway = String(
          scrollTop > 0 && Number.isFinite(initialTop) && headerTop < initialTop,
        )
        previewElement.dataset.contentMoves = String(scrollTop > 0)

        if (scrollStatusRef.current) {
          scrollStatusRef.current.textContent = `owner=${
            previewElement.dataset.scrollOwner
          } · sticky-owner=${previewElement.dataset.stickyScrollOwner} · same-owner=${
            previewElement.dataset.stickySharesScrollOwner
          } · scrollTop=${previewElement.dataset.articleScrollTop} · sticky=${
            toolbarPinned
          } · underlay=${sample} · backdrop-filter=${backdropFilter}`
        }
      })
    }

    scrollElement.addEventListener("scroll", updateScrollEvidence, { passive: true })
    window.addEventListener("resize", updateScrollEvidence)
    globalThis.addEventListener("orientationchange", updateScrollEvidence)
    updateScrollEvidence()

    return () => {
      scrollElement.removeEventListener("scroll", updateScrollEvidence)
      window.removeEventListener("resize", updateScrollEvidence)
      globalThis.removeEventListener("orientationchange", updateScrollEvidence)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [titleVariant, view])

  return (
    <main
      className="demo-root"
      data-reduced-transparency={reducedTransparency}
      data-safe-area-simulation={safeAreaSimulation}
      data-theme={theme}
    >
      <header className="demo-header">
        <Button
          aria-label="Sidebar trigger"
          className="demo-sidebar-control demo-icon-control"
          shape="circle"
        >
          ☰
        </Button>
        <div className="demo-brand">
          <span>ReactFlux</span>
          <span className="demo-subtitle">Liquid Glass / Perception Gate R2</span>
        </div>
        <nav aria-label="Preview view" className="demo-view-switch">
          <button
            className={view === "list" ? "demo-switch-active" : ""}
            onClick={() => setView("list")}
          >
            List chrome
          </button>
          <button
            className={view === "article" ? "demo-switch-active" : ""}
            onClick={() => setView("article")}
          >
            Article actions
          </button>
        </nav>
        <div className="demo-mode-switch">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button onClick={() => setReducedTransparency(!reducedTransparency)}>
            {reducedTransparency ? "Glass" : "Reduce transparency"}
          </button>
          <button onClick={() => setSafeAreaSimulation(!safeAreaSimulation)}>
            {safeAreaSimulation ? "Safe area: simulated" : "Simulate PWA safe area"}
          </button>
        </div>
      </header>
      <div className="demo-stage" data-view={view}>
        {view === "list" ? (
          <>
            <SurfaceComparison />
            <MaterialSamples />
            <ListView
              activeControl={activeControl}
              filterValue={filterValue}
              searchModalVisible={searchModalVisible}
              onActiveSelect={setActiveControl}
              onFilterChange={setFilterValue}
              onSearchOpen={() => {
                setActiveControl("search")
                setSearchModalVisible(true)
              }}
            />
          </>
        ) : (
          <DetailView
            scrollAreaRef={articleScrollAreaRef}
            scrollPreviewRef={articlePreviewRef}
            scrollStatusRef={scrollStatusRef}
            titleVariant={titleVariant}
            onTitleVariantChange={setTitleVariant}
          />
        )}
      </div>
      <aside aria-label="Interaction state guidance" className="demo-state-legend">
        <span>REST — inactive control</span>
        <span>ACTIVE_SELECTED — click Search or date</span>
        <span>PRESSED — hold a selected control</span>
        <span>hover any control</span>
        <span>press any control</span>
        <span>Tab to focus</span>
        <span>disabled example in list view</span>
        <span>sidebar trigger stays embedded/opaque</span>
        <span>opaque content has no glass fill or backdrop filter</span>
        <span>opaque does not mean adding a gray card</span>
        <span>Search trigger is glass; the Search dialog stays opaque.</span>
      </aside>
      <SearchModalPreview
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
      />
    </main>
  )
}

ReactDOM.createRoot(document.querySelector("#root")).render(<Harness />)

export default Harness
