import { Button, Radio } from "@arco-design/web-react"
import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"

import "@arco-design/web-react/dist/css/arco.css"
import "@/App.css"
import "@/components/Article/ActionButtons.css"
import "@/components/Content/FooterPanel.css"
import "@/theme.css"
import "@/liquid-glass.css"
import "./phase2b2b-liquid-glass.css"

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

const ImageSample = () => (
  <div aria-label="Abstract landscape image sample" className="demo-image" role="img">
    <svg aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 720 360">
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop offset="0" stopColor="#6e91be" />
          <stop offset="1" stopColor="#e2b787" />
        </linearGradient>
        <linearGradient id="hill" x2="0" y2="1">
          <stop offset="0" stopColor="#566f64" />
          <stop offset="1" stopColor="#273e3c" />
        </linearGradient>
      </defs>
      <rect fill="url(#sky)" height="360" width="720" />
      <circle cx="535" cy="94" fill="#f5dfbd" opacity="0.9" r="37" />
      <path d="M0 260 140 152l119 94 131-126 169 141 72-67 89 67v99H0Z" fill="#71877b" />
      <path d="m0 300 169-92 128 71 162-99 261 118v62H0Z" fill="url(#hill)" />
    </svg>
    <Button
      aria-label="Open image preview"
      className="nf-glass-control demo-overlay-control"
      shape="circle"
    >
      ⤢
    </Button>
    <span className="demo-image-caption">IMAGE / CHROME OVER MEDIA</span>
  </div>
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

const ListView = ({ filterValue, onFilterChange }) => (
  <>
    <section aria-label="List controls" className="demo-list-toolbar">
      <Button aria-label="Search" className="nf-glass-control" shape="circle">
        ⌕
      </Button>
      <Button aria-label="Filter by date" className="nf-glass-control" shape="circle">
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
  <section className="demo-detail-layout">
    <ActionButtonsPreview />
    <ArticleBody />
    <div className="demo-detail-overlay">
      <ImageSample />
    </div>
  </section>
)

const Harness = () => {
  const [theme, setTheme] = useState("dark")
  const [reducedTransparency, setReducedTransparency] = useState(false)
  const [safeAreaSimulation, setSafeAreaSimulation] = useState(false)
  const [view, setView] = useState("list")
  const [filterValue, setFilterValue] = useState("all")

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
          <span className="demo-subtitle">Liquid Glass / Interaction Gate</span>
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
          <ListView filterValue={filterValue} onFilterChange={setFilterValue} />
        ) : (
          <DetailView />
        )}
      </div>
      <aside aria-label="Interaction state guidance" className="demo-state-legend">
        <span>rest</span>
        <span>hover any control</span>
        <span>press any control</span>
        <span>Tab to focus</span>
        <span>disabled example in list view</span>
        <span>sidebar trigger stays embedded/opaque</span>
      </aside>
    </main>
  )
}

ReactDOM.createRoot(document.querySelector("#root")).render(<Harness />)

export default Harness
