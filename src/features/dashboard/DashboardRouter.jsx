import { motion } from 'framer-motion'
import HomeDashboard from './HomeDashboard'
import ManagerDashboard from '../admin/ManagerDashboard'
import CoachDashboard from '../coach/CoachDashboard'
import DashboardFeedPreview from '../feed/DashboardFeedPreview'
import useActiveRole from '../../hooks/useActiveRole'
import usePlayerProfile from '../profile/usePlayerProfile'

function DashboardRouter({ session }) {
  const primaryRole = session?.user?.user_metadata?.role || 'player'
  const [activeRole] = useActiveRole(primaryRole)
  const { profile } = usePlayerProfile()
  const canUseCoach = primaryRole === 'coach' || profile.isCoach
  const role =
    primaryRole === 'manager'
      ? 'manager'
      : activeRole === 'coach' && canUseCoach
        ? 'coach'
        : 'player'
  const dashboards = {
    coach: CoachDashboard,
    manager: ManagerDashboard,
    player: HomeDashboard,
  }
  const DashboardComponent = dashboards[role] || HomeDashboard

  return (
    <motion.div
      key={role}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="grid gap-6">
        <DashboardComponent />
        <DashboardFeedPreview />
      </div>
    </motion.div>
  )
}

export default DashboardRouter
