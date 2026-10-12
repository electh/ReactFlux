import AdaptiveScrollArea from "@/components/ui/AdaptiveScrollArea"

// Routing composition placeholder. Later tasks own editorial session, sections and states.
const HomeEditorial = ({ entryListRef }) => (
  <div className="home-editorial" style={{ flex: 1, minHeight: 0 }}>
    <AdaptiveScrollArea
      ref={entryListRef}
      scrollableNodeProps={{ tabIndex: -1 }}
      style={{ height: "100%" }}
    />
  </div>
)

export default HomeEditorial
