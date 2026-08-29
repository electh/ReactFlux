import { lazy, Suspense } from "react"

const PlyrPlayer = lazy(() => import("./PlyrPlayer"))

const LazyPlyrPlayer = (props) => (
  <Suspense fallback={<div aria-busy="true" style={{ minHeight: 44 }} />}>
    <PlyrPlayer {...props} />
  </Suspense>
)

export default LazyPlyrPlayer
