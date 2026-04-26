import { motion } from 'framer-motion'
import HomeDashboard from './HomeDashboard'
import ManagerDashboard from '../admin/ManagerDashboard'

function DashboardRouter({ session }) {
  const role = session?.user?.user_metadata?.role || 'player'
  const DashboardComponent = role === 'manager' ? ManagerDashboard : HomeDashboard

  return (
    <motion.div
      key={role}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <DashboardComponent />
    </motion.div>
  )
}

export default DashboardRouter
