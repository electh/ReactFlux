const VIEWPORTS = [
  { height: 844, width: 390 },
  { height: 1024, width: 768 },
  { height: 1104, width: 884 },
  { height: 768, width: 1024 },
  { height: 800, width: 1280 },
  { height: 900, width: 1440 },
]

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const params = new URLSearchParams(globalThis.location.search)
const theme = params.get("theme") ?? "light"
const singleViewport = params.get("single")?.match(/^(\d+)x(\d+)$/)

if (singleViewport) {
  document.body.classList.add("single-viewport")
}

const createViewportFrame = ({ height, width }) => {
  const frame = document.createElement("iframe")
  frame.title = `Structural gate ${width} by ${height}`
  frame.width = width
  frame.height = height
  frame.style.width = `${width}px`
  frame.style.height = `${height}px`
  frame.src = `/scripts/tests/phase2b2c01-rounded-editorial-cards.html?viewport=${width}x${height}&theme=${theme}`
  return frame
}

const waitForGate = async (frame) => {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const report = frame.contentWindow.phase2b2c01Results
      if (report) {
        return report
      }
    } catch {
      // The frame is still loading its same-origin page.
    }
    await sleep(50)
  }
  throw new Error(`Timed out waiting for ${frame.title}`)
}

const runViewportMatrix = async () => {
  const container = document.querySelector("#viewport-cases")
  const viewports = singleViewport
    ? [{ width: Number(singleViewport[1]), height: Number(singleViewport[2]) }]
    : VIEWPORTS
  const cases = viewports.map((viewport) => {
    const frame = createViewportFrame(viewport)
    if (singleViewport) {
      frame.style.transform = `scale(${Math.min(1, window.innerWidth / viewport.width, window.innerHeight / viewport.height)})`
      frame.style.transformOrigin = "top center"
    }
    container.append(frame)
    return { frame, viewport }
  })
  const results = await Promise.all(
    cases.map(async ({ frame, viewport }) => {
      const report = await waitForGate(frame)
      const viewportMatches =
        report.viewport.width === viewport.width && report.viewport.height === viewport.height
      return {
        failCount: report.failCount,
        failingChecks: report.checks
          .filter(({ status }) => status === "FAIL")
          .map(({ name }) => name),
        pass: viewportMatches && report.failCount === 0,
        viewport: report.viewport,
        expected: viewport,
      }
    }),
  )
  const matrix = {
    failCount: results.filter(({ pass }) => !pass).length,
    results,
  }
  globalThis.phase2b2c01ViewportMatrix = matrix
  document.querySelector("#matrix-status").textContent =
    `${theme.toUpperCase()} ${matrix.failCount === 0 ? "PASS" : "FAIL"}`
  document.querySelector("#matrix-report").textContent = JSON.stringify(matrix, null, 2)
}

try {
  await runViewportMatrix()
} catch (error) {
  document.querySelector("#matrix-status").textContent = "ERROR"
  document.querySelector("#matrix-report").textContent = String(error)
}
