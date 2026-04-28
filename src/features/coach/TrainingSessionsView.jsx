import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  Dumbbell,
  Save,
  Trash2,
  Users,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { XP_SOURCES, awardPlayerXp } from '../gamification/xpLedger'
import { ensurePlayerProfile } from '../profile/profileConnections'

const categoryOptions = ['D', 'C', 'B', 'A', 'Pro']

const drillPresets = [
  {
    value: 'saque_y_devolucion',
    label: 'Saque y devolucion',
    focus: 'Saque',
    plan: 'Calentamiento, tecnica de saque, devoluciones cruzadas y puntos condicionados.',
  },
  {
    value: 'consistencia_fondo',
    label: 'Consistencia de fondo',
    focus: 'Derecha/Reves',
    plan: 'Peloteo controlado, patrones cruzados, cambio paralelo y rally a 20 bolas.',
  },
  {
    value: 'volea_y_red',
    label: 'Volea y juego de red',
    focus: 'Volea',
    plan: 'Split step, voleas dirigidas, aproximacion y cierre de punto en red.',
  },
  {
    value: 'movilidad_defensa',
    label: 'Movilidad y defensa',
    focus: 'Movilidad',
    plan: 'Escalera, desplazamientos laterales, recuperacion al centro y defensa profunda.',
  },
  {
    value: 'slice_variacion',
    label: 'Slice y variaciones',
    focus: 'Slice',
    plan: 'Slice de reves, cambio de ritmo, aproximacion con slice y puntos tacticos.',
  },
  {
    value: 'match_play',
    label: 'Match play tactico',
    focus: 'Competencia',
    plan: 'Situaciones de marcador, juegos cortos, tie-breaks y cierre bajo presion.',
  },
]

function TrainingSessionsView() {
  const [coachProfile, setCoachProfile] = useState(null)
  const [players, setPlayers] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayIsoDate())
  const [attendance, setAttendance] = useState([])
  const [form, setForm] = useState(createDefaultForm())
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [presentPlayers, setPresentPlayers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId),
    [selectedSessionId, sessions],
  )

  const selectedDateSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.session_date === selectedDate)
        .sort(sortSessionsByTime),
    [selectedDate, sessions],
  )

  useEffect(() => {
    let isMounted = true

    const loadBase = async () => {
      setIsLoading(true)
      setError('')

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (!isMounted) return

      if (userError || !userData.user) {
        setError(userError?.message || 'No se pudo validar tu perfil.')
        setIsLoading(false)
        return
      }

      const { data: existingCoach, error: coachError } = await supabase
        .from('players')
        .select('id, user_id, club_id, is_coach')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      if (!isMounted) return

      if (coachError) {
        setError(coachError.message)
        setIsLoading(false)
        return
      }

      let nextCoach = existingCoach

      if (!nextCoach && userData.user.user_metadata?.role === 'coach') {
        const { data: ensuredCoach, error: ensureError } =
          await ensurePlayerProfile(userData.user, {
            role: 'coach',
            is_coach: true,
            force: true,
          })

        if (!isMounted) return

        if (ensureError) {
          setError(ensureError.message)
          setIsLoading(false)
          return
        }

        nextCoach = ensuredCoach
      }

      setCoachProfile(nextCoach)

      if (!nextCoach?.club_id) {
        setIsLoading(false)
        return
      }

      try {
        const [clubPlayers, clubSessions] = await Promise.all([
          fetchPlayers(nextCoach.club_id),
          fetchSessions(nextCoach.club_id),
        ])

        if (!isMounted) return

        setPlayers(clubPlayers)
        setSelectedPlayers(clubPlayers.map((player) => String(player.id)))
        setSessions(clubSessions)

        const firstPlanned =
          clubSessions.find((session) => session.status === 'planned') ||
          clubSessions[0]

        if (firstPlanned) {
          setSelectedDate(firstPlanned.session_date)
          setSelectedSessionId(firstPlanned.id)
        }
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError.message)
      }

      setIsLoading(false)
    }

    loadBase()

    return () => {
      isMounted = false
    }
  }, [])

  const loadAttendance = useCallback(async (sessionId, isMounted = true) => {
    const { data, error: attendanceError } = await supabase
      .from('training_attendance')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (!isMounted) return

    if (attendanceError) {
      setAttendance([])
      setPresentPlayers([])
      setError(attendanceError.message)
      return
    }

    const rows = data || []
    setAttendance(rows)
    setPresentPlayers(
      rows
        .filter((row) => row.status === 'present')
        .map((row) => String(row.player_id)),
    )
  }, [])

  useEffect(() => {
    if (!selectedSessionId) return

    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      loadAttendance(selectedSessionId, isMounted)
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [loadAttendance, selectedSessionId])

  const handleField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleDrillPreset = (value) => {
    const preset = drillPresets.find((item) => item.value === value)

    setForm((current) => ({
      ...current,
      drillPreset: value,
      focusArea: preset?.focus || current.focusArea,
      sessionPlan: preset?.plan || current.sessionPlan,
      title: current.title || preset?.label || '',
    }))
  }

  const toggleCategory = (category) => {
    setForm((current) => {
      const categories = current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category]

      return { ...current, categories }
    })
  }

  const toggleSelectedPlayer = (playerId) => {
    setSelectedPlayers((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    )
  }

  const selectAllPlayers = () => {
    setSelectedPlayers(players.map((player) => String(player.id)))
  }

  const togglePresentPlayer = (playerId) => {
    if (selectedSession?.status === 'closed') return

    setPresentPlayers((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    )
  }

  const markAllPresent = () => {
    if (selectedSession?.status === 'closed') return
    setPresentPlayers(attendance.map((row) => String(row.player_id)))
  }

  const handleCreateSession = async () => {
    if (!coachProfile?.club_id) {
      setError('Primero vincula tu perfil de coach a un club.')
      return
    }

    if (!form.title.trim() || !form.sessionDate) {
      setError('Agrega titulo y fecha para programar el entrenamiento.')
      return
    }

    if (selectedPlayers.length === 0) {
      setError('Selecciona al menos un jugador del club.')
      return
    }

    setIsSaving(true)
    setError('')
    setToast('')

    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .insert({
        club_id: coachProfile.club_id,
        coach_player_id: String(coachProfile.id),
        coach_user_id: coachProfile.user_id,
        title: form.title.trim(),
        session_date: form.sessionDate,
        session_time: form.sessionTime || null,
        duration_minutes: Number(form.durationMinutes) || 60,
        court: form.court.trim() || null,
        categories: form.categories,
        focus_area: form.focusArea.trim() || null,
        drill_preset: form.drillPreset || null,
        session_plan: form.sessionPlan.trim() || null,
      })
      .select()
      .single()

    if (sessionError) {
      setError(sessionError.message)
      setIsSaving(false)
      return
    }

    const attendanceRows = players
      .filter((player) => selectedPlayers.includes(String(player.id)))
      .map((player) => ({
        session_id: session.id,
        player_id: String(player.id),
        user_id: player.user_id || null,
        club_id: coachProfile.club_id,
        status: 'invited',
      }))

    const { error: attendanceError } = await supabase
      .from('training_attendance')
      .insert(attendanceRows)

    if (attendanceError) {
      setError(attendanceError.message)
      setIsSaving(false)
      return
    }

    setSessions((current) => [session, ...current])
    setSelectedDate(session.session_date)
    setSelectedSessionId(session.id)
    setForm(createDefaultForm())
    setSelectedPlayers(players.map((player) => String(player.id)))
    setToast('Entrenamiento programado. La lista queda lista para pasar asistencia.')
    setIsSaving(false)
  }

  const handleDeleteSession = async (sessionId) => {
    const session = sessions.find((item) => item.id === sessionId)

    if (!session || session.status === 'closed') return

    setIsSaving(true)
    setError('')
    setToast('')

    const { error: deleteError } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', sessionId)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      const nextSessions = sessions.filter((item) => item.id !== sessionId)
      setSessions(nextSessions)
      setAttendance([])
      setPresentPlayers([])
      setSelectedSessionId(nextSessions[0]?.id || '')
      setToast('Entrenamiento eliminado.')
    }

    setIsSaving(false)
  }

  const handleCloseSession = async () => {
    if (!selectedSession || selectedSession.status === 'closed') return

    setIsSaving(true)
    setError('')
    setToast('')

    const presentSet = new Set(presentPlayers)
    const updates = attendance.map((row) =>
      supabase
        .from('training_attendance')
        .update({
          status: presentSet.has(String(row.player_id)) ? 'present' : 'absent',
          marked_at: new Date().toISOString(),
        })
        .eq('id', row.id),
    )

    const updateResults = await Promise.all(updates)
    const updateError = updateResults.find((result) => result.error)?.error

    if (updateError) {
      setError(updateError.message)
      setIsSaving(false)
      return
    }

    const presentRows = attendance.filter((row) =>
      presentSet.has(String(row.player_id)),
    )

    for (const row of presentRows) {
      const player = players.find(
        (item) => String(item.id) === String(row.player_id),
      )

      if (player) {
        const { error: xpError } = await awardPlayerXp({
          player,
          amount: XP_SOURCES.training_attendance,
          source: 'training_attendance',
          sourceId: selectedSession.id,
          label: 'Asistencia a entrenamiento',
          description: selectedSession.title,
          metadata: {
            training_session_id: selectedSession.id,
            duration_minutes: selectedSession.duration_minutes,
            drill_preset: selectedSession.drill_preset,
          },
        })

        if (xpError) {
          setError(xpError.message)
          setIsSaving(false)
          return
        }

        await supabase
          .from('training_attendance')
          .update({ xp_awarded: XP_SOURCES.training_attendance })
          .eq('id', row.id)
      }
    }

    const { data: closedSession, error: closeError } = await supabase
      .from('training_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', selectedSession.id)
      .select()
      .single()

    if (closeError) {
      setError(closeError.message)
    } else {
      setSessions((current) =>
        current.map((session) =>
          session.id === closedSession.id ? closedSession : session,
        ),
      )
      setToast(`Sesion cerrada. ${presentRows.length} jugadores recibieron +50 XP.`)
      await loadAttendance(selectedSession.id, true)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return <p className="text-sm text-open-muted">Cargando entrenamientos...</p>
  }

  return (
    <section className="grid gap-5 border border-open-light bg-open-surface p-5 md:p-6">
      <TrainingHeader sessionCount={sessions.length} />

      {error ? (
        <p className="border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
          {error}
        </p>
      ) : null}

      {toast ? (
        <p className="border border-open-light bg-open-bg px-4 py-3 text-sm font-semibold text-open-ink">
          {toast}
        </p>
      ) : null}

      {!coachProfile?.club_id ? (
        <p className="border border-open-light bg-open-bg px-4 py-5 text-sm text-open-muted">
          Vincula tu coach profile a un club para programar entrenamientos.
        </p>
      ) : (
        <div className="grid gap-5 2xl:grid-cols-[0.9fr_1.1fr]">
          <CreateSessionForm
            form={form}
            players={players}
            selectedPlayers={selectedPlayers}
            isSaving={isSaving}
            onDrillPreset={handleDrillPreset}
            onField={handleField}
            onSelectAllPlayers={selectAllPlayers}
            onToggleCategory={toggleCategory}
            onTogglePlayer={toggleSelectedPlayer}
            onCreate={handleCreateSession}
          />

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1fr] 2xl:grid-cols-1">
            <TrainingCalendar
              selectedDate={selectedDate}
              selectedSessionId={selectedSessionId}
              sessions={sessions}
              sessionsForDate={selectedDateSessions}
              onDeleteSession={handleDeleteSession}
              onSelectDate={setSelectedDate}
              onSelectSession={setSelectedSessionId}
            />

            <SessionAttendance
              attendance={attendance}
              players={players}
              presentPlayers={presentPlayers}
              selectedSession={selectedSession}
              isSaving={isSaving}
              onMarkAllPresent={markAllPresent}
              onTogglePresent={togglePresentPlayer}
              onCloseSession={handleCloseSession}
            />
          </div>
        </div>
      )}
    </section>
  )
}

function TrainingHeader({ sessionCount }) {
  return (
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold text-open-muted">Entrenamientos</p>
        <h2 className="mt-2 text-2xl font-semibold text-open-ink">
          Calendario y asistencia
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="border border-open-light bg-open-bg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          {sessionCount} sesiones
        </span>
        <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-bg">
          <Dumbbell size={20} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}

function CreateSessionForm({
  form,
  players,
  selectedPlayers,
  isSaving,
  onDrillPreset,
  onField,
  onSelectAllPlayers,
  onToggleCategory,
  onTogglePlayer,
  onCreate,
}) {
  return (
    <article className="grid gap-4 border border-open-light bg-open-bg p-4">
      <div className="flex items-center gap-3">
        <CalendarPlus size={18} strokeWidth={1.8} />
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
          Programar clase
        </h3>
      </div>

      <select
        value={form.drillPreset}
        onChange={(event) => onDrillPreset(event.target.value)}
        className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
      >
        <option value="">Preset de drills</option>
        {drillPresets.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </select>

      <input
        value={form.title}
        onChange={(event) => onField('title', event.target.value)}
        placeholder="Titulo de la clase"
        className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="date"
          value={form.sessionDate}
          onChange={(event) => onField('sessionDate', event.target.value)}
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
        <input
          type="time"
          value={form.sessionTime}
          onChange={(event) => onField('sessionTime', event.target.value)}
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
        <input
          type="number"
          min="15"
          step="15"
          value={form.durationMinutes}
          onChange={(event) => onField('durationMinutes', event.target.value)}
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={form.court}
          onChange={(event) => onField('court', event.target.value)}
          placeholder="Cancha"
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
        <input
          value={form.focusArea}
          onChange={(event) => onField('focusArea', event.target.value)}
          placeholder="Que se va a ver"
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
      </div>

      <textarea
        value={form.sessionPlan}
        onChange={(event) => onField('sessionPlan', event.target.value)}
        placeholder="Plan rapido de clase"
        rows={3}
        className="resize-none border border-open-light bg-open-surface px-3 py-3 text-sm text-open-ink outline-none focus:border-open-primary"
      />

      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onToggleCategory(category)}
            className={[
              'h-9 border px-3 text-xs font-semibold transition',
              form.categories.includes(category)
                ? 'border-open-ink bg-open-ink text-white'
                : 'border-open-light bg-open-surface text-open-muted hover:border-open-primary',
            ].join(' ')}
          >
            Cat. {category}
          </button>
        ))}
      </div>

      <div className="border border-open-light bg-open-surface p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
            Jugadores del club
          </span>
          <button
            type="button"
            onClick={onSelectAllPlayers}
            className="h-8 border border-open-light bg-open-bg px-3 text-xs font-semibold text-open-ink"
          >
            Todos
          </button>
        </div>
        <div className="grid max-h-64 gap-2 overflow-auto">
          {players.map((player) => (
            <PlayerCheckRow
              key={player.id}
              isSelected={selectedPlayers.includes(String(player.id))}
              player={player}
              onToggle={() => onTogglePlayer(String(player.id))}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onCreate}
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-open-muted"
      >
        <Save size={16} strokeWidth={1.8} />
        {isSaving ? 'Guardando...' : 'Programar entrenamiento'}
      </button>
    </article>
  )
}

function TrainingCalendar({
  selectedDate,
  selectedSessionId,
  sessions,
  sessionsForDate,
  onDeleteSession,
  onSelectDate,
  onSelectSession,
}) {
  const monthDays = buildMonthDays(selectedDate)

  return (
    <article className="grid gap-4 border border-open-light bg-open-bg p-4">
      <div className="flex items-center gap-3">
        <CalendarDays size={18} strokeWidth={1.8} />
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
          Calendario
        </h3>
      </div>

      <input
        type="date"
        value={selectedDate}
        onChange={(event) => onSelectDate(event.target.value)}
        className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
      />

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day) => {
          const count = sessions.filter(
            (session) => session.session_date === day.iso,
          ).length
          const isSelected = day.iso === selectedDate

          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => onSelectDate(day.iso)}
              className={[
                'grid aspect-square place-items-center border text-xs font-semibold',
                isSelected
                  ? 'border-open-ink bg-open-ink text-white'
                  : 'border-open-light bg-open-surface text-open-muted',
              ].join(' ')}
            >
              <span>{day.label}</span>
              {count ? <span className="text-[10px]">{count}</span> : null}
            </button>
          )
        })}
      </div>

      <div className="grid gap-2">
        {sessionsForDate.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelectSession(session.id)}
            className={[
              'flex items-start justify-between gap-3 border p-3 text-left',
              selectedSessionId === session.id
                ? 'border-open-ink bg-open-surface'
                : 'border-open-light bg-open-surface',
            ].join(' ')}
          >
            <span>
              <span className="block text-sm font-semibold text-open-ink">
                {session.title}
              </span>
              <span className="mt-1 block text-xs text-open-muted">
                {formatSessionMeta(session)}
              </span>
            </span>
            {session.status !== 'closed' ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteSession(session.id)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onDeleteSession(session.id)
                }}
                className="grid h-9 w-9 shrink-0 place-items-center border border-open-light bg-open-bg text-open-muted"
                aria-label="Eliminar entrenamiento"
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </span>
            ) : null}
          </button>
        ))}

        {sessionsForDate.length === 0 ? (
          <p className="border border-open-light bg-open-surface px-4 py-5 text-sm text-open-muted">
            No hay entrenamientos programados para esta fecha.
          </p>
        ) : null}
      </div>
    </article>
  )
}

function SessionAttendance({
  attendance,
  players,
  presentPlayers,
  selectedSession,
  isSaving,
  onMarkAllPresent,
  onTogglePresent,
  onCloseSession,
}) {
  return (
    <article className="grid gap-4 border border-open-light bg-open-bg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users size={18} strokeWidth={1.8} />
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
            Pasar lista
          </h3>
        </div>
        {selectedSession?.status !== 'closed' && attendance.length ? (
          <button
            type="button"
            onClick={onMarkAllPresent}
            className="h-8 border border-open-light bg-open-surface px-3 text-xs font-semibold text-open-ink"
          >
            Todos presentes
          </button>
        ) : null}
      </div>

      {selectedSession ? (
        <div className="grid gap-4">
          <SessionSummary session={selectedSession} />
          <div className="grid gap-2">
            {attendance.map((row) => {
              const player = players.find(
                (item) => String(item.id) === String(row.player_id),
              )
              const isPresent = presentPlayers.includes(String(row.player_id))
              const isClosed = selectedSession.status === 'closed'

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onTogglePresent(String(row.player_id))}
                  disabled={isClosed}
                  className="flex items-center justify-between gap-3 border border-open-light bg-open-surface px-3 py-3 text-left disabled:cursor-not-allowed"
                >
                  <span>
                    <span className="block text-sm font-semibold text-open-ink">
                      {player?.full_name || 'Jugador OPEN'}
                    </span>
                    <span className="text-xs text-open-muted">
                      {isClosed
                        ? row.status === 'present'
                          ? `Presente - +${row.xp_awarded || 50} XP`
                          : 'Ausente'
                        : 'Toca para presente/ausente'}
                    </span>
                  </span>
                  <span
                    className={[
                      'grid h-7 w-7 place-items-center border',
                      isPresent || row.status === 'present'
                        ? 'border-open-ink bg-open-ink text-white'
                        : 'border-open-light text-transparent',
                    ].join(' ')}
                  >
                    <Check size={15} strokeWidth={2} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="border border-open-light bg-open-surface px-4 py-5 text-sm text-open-muted">
          Selecciona una clase del calendario para pasar asistencia.
        </p>
      )}

      {selectedSession && selectedSession.status !== 'closed' ? (
        <button
          type="button"
          onClick={onCloseSession}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 bg-open-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-open-muted"
        >
          <Check size={16} strokeWidth={1.8} />
          {isSaving ? 'Cerrando...' : 'Cerrar clase y dar XP'}
        </button>
      ) : null}
    </article>
  )
}

function SessionSummary({ session }) {
  return (
    <div className="grid gap-3 border border-open-light bg-open-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-open-ink">
            {session.title}
          </h4>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
            {session.focus_area || 'Plan general'}
          </p>
        </div>
        <span className="border border-open-light bg-open-bg px-2 py-1 text-xs font-semibold text-open-muted">
          {session.status}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-open-muted">
        <span className="inline-flex items-center gap-1 border border-open-light bg-open-bg px-2 py-1">
          <Clock size={13} strokeWidth={1.8} />
          {session.session_time || '--:--'} - {session.duration_minutes || 60} min
        </span>
        <span className="border border-open-light bg-open-bg px-2 py-1">
          {session.court || 'Cancha pendiente'}
        </span>
      </div>
      {session.session_plan ? (
        <p className="text-sm leading-6 text-open-muted">{session.session_plan}</p>
      ) : null}
    </div>
  )
}

function PlayerCheckRow({ isSelected, player, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between gap-3 border border-open-light bg-open-bg px-3 py-2 text-left text-sm"
    >
      <span>
        <span className="block font-semibold text-open-ink">
          {player.full_name || 'Jugador OPEN'}
        </span>
        <span className="text-xs text-open-muted">
          Cat. {player.current_category || player.suggested_category || 'pendiente'}
        </span>
      </span>
      <span
        className={[
          'grid h-6 w-6 place-items-center border',
          isSelected
            ? 'border-open-ink bg-open-ink text-white'
            : 'border-open-light text-transparent',
        ].join(' ')}
      >
        <Check size={14} strokeWidth={2} />
      </span>
    </button>
  )
}

async function fetchPlayers(clubId) {
  const { data, error } = await supabase
    .from('players')
    .select('id, user_id, full_name, email, xp, level, club_id, role, is_coach, club_membership_status, current_category, suggested_category')
    .eq('club_id', clubId)
    .or('is_coach.is.null,is_coach.eq.false')
    .neq('club_membership_status', 'rejected')
    .order('full_name', { ascending: true })

  if (error) throw error
  return data || []
}

async function fetchSessions(clubId) {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('club_id', clubId)
    .order('session_date', { ascending: false })
    .order('session_time', { ascending: true, nullsFirst: false })
    .limit(40)

  if (error) throw error
  return data || []
}

function buildMonthDays(selectedDate) {
  const base = new Date(`${selectedDate}T00:00:00`)
  const year = base.getFullYear()
  const month = base.getMonth()
  const days = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(year, month, index + 1)
    return {
      iso: date.toISOString().slice(0, 10),
      label: index + 1,
    }
  })
}

function sortSessionsByTime(a, b) {
  return (a.session_time || '99:99').localeCompare(b.session_time || '99:99')
}

function formatSessionMeta(session) {
  const pieces = [
    session.session_time || '--:--',
    `${session.duration_minutes || 60} min`,
    session.court || 'Cancha pendiente',
  ]

  return pieces.join(' · ')
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function createDefaultForm() {
  return {
    title: '',
    sessionDate: todayIsoDate(),
    sessionTime: '',
    durationMinutes: '60',
    court: '',
    categories: [],
    drillPreset: '',
    focusArea: '',
    sessionPlan: '',
  }
}

export default TrainingSessionsView
