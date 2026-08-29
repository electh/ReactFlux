import { useEffect, useRef } from "react"
import Lightbox from "yet-another-react-lightbox"
import Counter from "yet-another-react-lightbox/plugins/counter"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/plugins/counter.css"
import "yet-another-react-lightbox/styles.css"

const lightboxPlugins = [Counter, Fullscreen, Zoom]

const ArticleLightbox = ({
  animation,
  closeRequested,
  index,
  open,
  slides,
  onClose,
  onExited,
  onExiting,
  onView,
}) => {
  const controllerRef = useRef(null)
  const closeRequestHandledRef = useRef(false)

  useEffect(() => {
    if (!closeRequested) {
      closeRequestHandledRef.current = false
    } else if (!closeRequestHandledRef.current && controllerRef.current) {
      closeRequestHandledRef.current = true
      controllerRef.current.close()
    }
  }, [closeRequested])

  return (
    <Lightbox
      animation={animation}
      carousel={{ finite: true, padding: 0 }}
      className="article-lightbox"
      close={onClose}
      controller={{ closeOnBackdropClick: true, ref: controllerRef }}
      index={index}
      on={{ exited: onExited, exiting: onExiting, view: onView }}
      open={open}
      plugins={lightboxPlugins}
      slides={slides}
    />
  )
}

export default ArticleLightbox
