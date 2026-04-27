import { motion } from 'framer-motion'
import BrandKitEditor from './BrandKitEditor'
import ClubPlayersManager from './ClubPlayersManager'

function ManagerDashboard() {
  return (
    <motion.section
      className="grid gap-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Manager
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            Configuración del Club
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-open-muted">
          Personaliza la identidad visual que verán jugadores, coaches y torneos.
        </p>
      </div>

      <BrandKitEditor />
      <ClubPlayersManager />
    </motion.section>
  )
}

export default ManagerDashboard
