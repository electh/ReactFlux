import { motion } from "framer-motion"

import { ANIMATION_DURATION_S } from "@/utils/constants"

const FadeTransition = ({ children, duration = ANIMATION_DURATION_S, y = 0, x = 0, ...props }) => {
  const initialPosition = {
    ...(x === 0 ? {} : { x }),
    ...(y === 0 ? {} : { y }),
  }
  const settledPosition = {
    ...(x === 0 ? {} : { x: 0 }),
    ...(y === 0 ? {} : { y: 0 }),
  }

  return (
    <motion.div
      animate={{ opacity: 1, ...settledPosition }}
      exit={{ opacity: 0, ...settledPosition }}
      initial={{ opacity: 0, ...initialPosition }}
      transition={{ duration }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default FadeTransition
