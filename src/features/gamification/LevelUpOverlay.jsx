import { AnimatePresence, motion } from 'framer-motion'

const particles = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2
  const distance = 120 + (index % 4) * 22

  return {
    id: index,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size: 4 + (index % 3) * 2,
  }
})

function LevelUpOverlay({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-white/90 px-6 text-open-ink backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="relative grid place-items-center">
            <motion.div
              className="absolute h-28 w-28 rounded-full border border-open-dark bg-open-dark"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.35, 1], opacity: [0, 1, 0.08] }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />

            {particles.map((particle) => (
              <motion.span
                key={particle.id}
                className="absolute rounded-full bg-open-dark"
                style={{
                  height: particle.size,
                  width: particle.size,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: particle.x,
                  y: particle.y,
                  scale: [0, 1, 0],
                  opacity: [0, 0.55, 0],
                }}
                transition={{
                  duration: 1.35,
                  delay: 0.18,
                  ease: 'easeOut',
                }}
              />
            ))}

            <motion.div
              className="relative z-10 text-center"
              initial={{ y: 22, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ delay: 0.42, duration: 0.55, ease: 'easeOut' }}
            >
              <p className="open-logo text-sm text-open-muted">
                OPEN
              </p>
              <h2 className="mt-4 font-display text-5xl italic text-open-primary md:text-7xl">
                LEVEL UNLOCKED
              </h2>
              <p className="mt-4 text-sm font-medium text-open-muted">
                Nivel 13 disponible
              </p>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default LevelUpOverlay
