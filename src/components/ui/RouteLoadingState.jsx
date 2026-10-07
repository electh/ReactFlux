import { Spin } from "@arco-design/web-react"

import "./RouteLoadingState.css"

const RouteLoadingState = ({ className, label }) => {
  const stateClassName = className ? `route-loading-state ${className}` : "route-loading-state"

  return (
    <main className={stateClassName}>
      <div className="route-loading-status" role="status">
        <Spin aria-hidden="true" />
        <p>{label}</p>
      </div>
    </main>
  )
}

export default RouteLoadingState
