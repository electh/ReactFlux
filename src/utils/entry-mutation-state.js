import { getDataSessionRevision } from "@/store/dataState"

let mutationRevision = 0
let mutationSessionRevision = getDataSessionRevision()
const mutationIdleWaitersBySession = new Map()
const pendingMutationRequestsBySession = new Map()
const sessionResetCallbacks = new Set()

const resolveMutationWaiters = (sessionRevision, isCurrentSession) => {
  const waiters = mutationIdleWaitersBySession.get(sessionRevision)
  if (!waiters) {
    return
  }

  mutationIdleWaitersBySession.delete(sessionRevision)
  for (const resolve of waiters) {
    resolve(isCurrentSession)
  }
}

export const getEntryMutationSessionRevision = () => {
  const currentSessionRevision = getDataSessionRevision()
  if (currentSessionRevision === mutationSessionRevision) {
    return currentSessionRevision
  }

  const previousSessionRevision = mutationSessionRevision
  mutationSessionRevision = currentSessionRevision
  mutationRevision = 0
  for (const reset of sessionResetCallbacks) {
    reset()
  }
  resolveMutationWaiters(previousSessionRevision, false)
  return currentSessionRevision
}

export const registerEntryMutationSessionReset = (reset) => {
  sessionResetCallbacks.add(reset)
  return () => sessionResetCallbacks.delete(reset)
}

export const recordEntryMutationIntent = () => {
  const sessionRevision = getEntryMutationSessionRevision()
  mutationRevision += 1
  return sessionRevision
}

export const recordEntryMutationRequestStart = (sessionRevision) => {
  pendingMutationRequestsBySession.set(
    sessionRevision,
    (pendingMutationRequestsBySession.get(sessionRevision) ?? 0) + 1,
  )
}

export const recordEntryMutationRequestEnd = (sessionRevision) => {
  getEntryMutationSessionRevision()
  const pendingRequests = Math.max(
    0,
    (pendingMutationRequestsBySession.get(sessionRevision) ?? 1) - 1,
  )
  if (pendingRequests === 0) {
    pendingMutationRequestsBySession.delete(sessionRevision)
  } else {
    pendingMutationRequestsBySession.set(sessionRevision, pendingRequests)
  }
  if (sessionRevision === mutationSessionRevision) {
    mutationRevision += 1
  }
}

export const notifyEntryMutationIdle = (sessionRevision) => {
  if ((pendingMutationRequestsBySession.get(sessionRevision) ?? 0) === 0) {
    resolveMutationWaiters(sessionRevision, sessionRevision === mutationSessionRevision)
  }
}

export const getEntryMutationSnapshot = () => {
  const sessionRevision = getEntryMutationSessionRevision()
  return {
    pendingRequests: pendingMutationRequestsBySession.get(sessionRevision) ?? 0,
    revision: mutationRevision,
    sessionRevision,
  }
}

export const isEntryMutationSnapshotCurrent = (snapshot) => {
  const currentSnapshot = getEntryMutationSnapshot()
  return (
    snapshot.sessionRevision === currentSnapshot.sessionRevision &&
    snapshot.revision === currentSnapshot.revision &&
    currentSnapshot.pendingRequests === 0
  )
}

export const waitForEntryMutations = (snapshot) => {
  const currentSnapshot = getEntryMutationSnapshot()
  if (snapshot.sessionRevision !== currentSnapshot.sessionRevision) {
    return Promise.resolve(false)
  }
  if (currentSnapshot.pendingRequests === 0) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    const waiters = mutationIdleWaitersBySession.get(snapshot.sessionRevision) ?? new Set()
    waiters.add(resolve)
    mutationIdleWaitersBySession.set(snapshot.sessionRevision, waiters)
  })
}
