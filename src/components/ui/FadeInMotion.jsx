import { motion } from "framer-motion";

const FadeInMotion = ({ children, duration = 0.2, y = 20 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 0 }}
    transition={{ duration }}
  >
    {children}
  </motion.div>
);

export default FadeInMotion;
