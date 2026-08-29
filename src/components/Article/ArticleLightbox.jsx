import Lightbox from "yet-another-react-lightbox"
import Counter from "yet-another-react-lightbox/plugins/counter"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/plugins/counter.css"
import "yet-another-react-lightbox/styles.css"

const lightboxPlugins = [Counter, Fullscreen, Zoom]

const ArticleLightbox = ({ animation, index, open, slides, onClose, onView }) => (
  <Lightbox
    animation={animation}
    carousel={{ finite: true, padding: 0 }}
    className="article-lightbox"
    close={onClose}
    controller={{ closeOnBackdropClick: true }}
    index={index}
    on={{ view: onView }}
    open={open}
    plugins={lightboxPlugins}
    slides={slides}
  />
)

export default ArticleLightbox
