import { motion } from "framer-motion";
import { ANIMATION_DURATION_S } from "../../utils/constants";

const FadeTransition = ({
  children,
  duration = ANIMATION_DURATION_S,
  y = 0,
  x = 0,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, y, x }}
    animate={{ opacity: 1, y: 0, x: 0 }}
    exit={{ opacity: 0, y: 0, x: 0 }}
    transition={{ duration }}
    {...props}
  >
    {children}
  </motion.div>
);

export default FadeTransition;
