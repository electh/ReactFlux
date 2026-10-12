const listeners = new Set()

export const subscribeEntryStatusMutationEvents = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// The caller supplies the current revision so obsolete settlements are discarded at the boundary.
export const publishEntryStatusMutationEvent = (event, currentSessionRevision) => {
  if (event.sessionRevision !== currentSessionRevision || event.entryIds.length === 0) {
    return false
  }
  for (const listener of listeners) {
    listener(event)
  }
  return true
}
