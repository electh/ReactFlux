import { Button, Radio } from "@arco-design/web-react"
import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"

import "@arco-design/web-react/dist/css/arco.css"
import "@/App.css"
import "@/components/Article/ActionButtons.css"
import "@/components/Article/ArticleDetail.css"
import "@/components/Content/Content.css"
import "@/components/Content/FooterPanel.css"
import "@/theme.css"
import "@/liquid-glass.css"
import "./phase2b2b-liquid-glass.css"

const samplePhoto = new URL("../../src/pages/images/background.jpg", import.meta.url).href

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

const ImageSample = ({ tone = "high" }) => (
  <figure aria-label={`${tone} contrast image sample`} className={`demo-image demo-image-${tone}`}>
    <img alt="" src={samplePhoto} />
    <Button
      aria-label="Open image preview"
      className="nf-glass-control demo-overlay-control"
      shape="circle"
    >
      ⤢
    </Button>
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

const ListView = ({ activeControl, filterValue, onActiveSelect, onFilterChange }) => (
  <>
    <section aria-label="List controls" className="demo-list-toolbar">
      <Button
        aria-label="Search"
        aria-pressed={activeControl === "search"}
        className={`nf-glass-control${activeControl === "search" ? " nf-glass-control-active" : ""}`}
        shape="circle"
        onClick={() => onActiveSelect("search")}
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

const DetailView = () => (
  <section
    aria-label="Scrollable article with floating actions"
    className="article-container article-container-full-size demo-detail-layout"
    data-gate="article-content-scrolls-behind-action-glass"
  >
    <article className="article-content demo-reader-content">
      <div className="scroll-container demo-reader-scroll">
        <div className="demo-reader-copy">
          <span className="demo-kicker">LIVE BACKDROP / ARTICLE READER</span>
          <h2>Chrome stays above the story as the article moves underneath</h2>
          <p>
            Scroll this opaque article. The action groups remain fixed at the top while text and
            photography pass behind their translucent surfaces.
          </p>
          <ImageSample tone="high" />
          <p>
            A second paragraph gives the controls visible letterforms to blur. The reader body has
            no glass fill and no backdrop filter of its own.
          </p>
          <ImageSample tone="low" />
          <p>
            Repeating story copy keeps the scroll test realistic: the controls should preserve
            contrast and remain distinct over both text and image content.
          </p>
        </div>
      </div>
    </article>
    <ActionButtonsPreview />
  </section>
)

const Harness = () => {
  const [theme, setTheme] = useState("dark")
  const [reducedTransparency, setReducedTransparency] = useState(false)
  const [safeAreaSimulation, setSafeAreaSimulation] = useState(false)
  const [view, setView] = useState("list")
  const [filterValue, setFilterValue] = useState("all")
  const [activeControl, setActiveControl] = useState(null)

  useEffect(() => {
    if (theme === "dark") {
      document.body.setAttribute("arco-theme", "dark")
    } else {
      document.body.removeAttribute("arco-theme")
    }
  }, [theme])

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
              onActiveSelect={setActiveControl}
              onFilterChange={setFilterValue}
            />
          </>
        ) : (
          <DetailView />
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
      </aside>
    </main>
  )
}

ReactDOM.createRoot(document.querySelector("#root")).render(<Harness />)

export default Harness
