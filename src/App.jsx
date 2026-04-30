import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import AuthView from './features/auth/AuthView'
import PasswordResetView from './features/auth/PasswordResetView'
import FaceToFaceView from './features/competition/FaceToFaceView'
import FriendlyMatchesView from './features/competition/FriendlyMatchesView'
import LiveJudgeView from './features/competition/LiveJudgeView'
import RankingView from './features/competition/RankingView'
import DashboardRouter from './features/dashboard/DashboardRouter'
import PlayerProfileView from './features/profile/PlayerProfileView'
import MembershipsView from './features/admin/MembershipsView'
import CanchasView from './features/admin/CanchasView'
import CourtReservationsView from './features/courts/CourtReservationsView'
import TrainingSessionsView from './features/coach/TrainingSessionsView'
import PlayerTrainingView from './features/coach/PlayerTrainingView'
import ProfileView from './features/profile/ProfileView'
import TournamentsView from './features/tournaments/TournamentsView'
import useActiveRole from './hooks/useActiveRole'
import usePlayerProfile from './features/profile/usePlayerProfile'
import { supabase } from './lib/supabase'

function CanchasRoute() {
  const { profile } = usePlayerProfile()
  if (profile.role === 'manager') return <CanchasView />
  return <CourtReservationsView />
}

function TrainingRoute() {
  const { profile, user } = usePlayerProfile()
  const [activeRole] = useActiveRole(user?.user_metadata?.role || 'player')
  if (profile.isCoach && activeRole === 'coach') return <TrainingSessionsView />
  return <PlayerTrainingView />
}

function App() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const isPasswordRecovery =
    window.location.hash.includes('type=recovery') ||
    window.location.hash.includes('access_token=')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-open-bg text-sm font-medium text-open-muted">
        Cargando OPEN
      </main>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isPasswordRecovery ? (
              <PasswordResetView session={session} />
            ) : session ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthView />
            )
          }
        />
        <Route
          path="/reset-password"
          element={<PasswordResetView session={session} />}
        />
        <Route
          path="/"
          element={
            isPasswordRecovery ? (
              <PasswordResetView session={session} />
            ) : session ? (
              <DashboardLayout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRouter session={session} />} />
          <Route path="matches" element={<FriendlyMatchesView />} />
          <Route path="live-match/:matchId" element={<LiveJudgeView />} />
          <Route path="tournaments" element={<TournamentsView />} />
          <Route path="ranking" element={<RankingView />} />
          <Route path="h2h" element={<FaceToFaceView />} />
          <Route path="h2h/:opponentId" element={<FaceToFaceView />} />
          <Route path="profile" element={<ProfileView />} />
          <Route path="players/:playerId" element={<PlayerProfileView />} />
          <Route path="memberships" element={<MembershipsView />} />
          <Route path="canchas" element={<CanchasRoute />} />
          <Route path="entrenamientos" element={<TrainingRoute />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={session ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
