import { supabase } from '../../lib/supabase'

const XP_SOURCES = {
  coach_evaluation: 50,
  training_attendance: 50,
  match_played: 30,
  match_win_bonus: 20,
  match_loss_bonus: 10,
  live_judge_bonus: 15,
}

function calculateLevelFromXp(xp) {
  const safeXp = Math.max(Number(xp) || 0, 0)
  return Math.floor(0.2 * Math.sqrt(safeXp)) + 1
}

function getNextLevelXp(level) {
  const safeLevel = Math.max(Number(level) || 1, 1)
  return Math.ceil((safeLevel / 0.2) ** 2)
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

async function awardPlayerXp({
  player,
  amount,
  source,
  sourceId = null,
  label,
  description = '',
  metadata = {},
  playerUpdates = {},
}) {
  if (!player?.id) {
    return { data: null, error: new Error('Jugador sin perfil OPEN.') }
  }

  const xpAmount = Math.max(Number(amount) || 0, 0)

  if (!xpAmount) {
    return { data: player, error: null, historyError: null }
  }

  const nextXp = (Number(player.xp) || 0) + xpAmount
  const nextLevel = calculateLevelFromXp(nextXp)

  const { data, error } = await supabase
    .from('players')
    .update({
      ...playerUpdates,
      xp: nextXp,
      level: nextLevel,
      last_activity_date: todayIsoDate(),
    })
    .eq('id', player.id)
    .select()
    .single()

  if (error) {
    return { data: null, error, historyError: null }
  }

  const { data: userData } = await supabase.auth.getUser()
  const historyPayload = {
    player_id: String(player.id),
    user_id: player.user_id || null,
    club_id: player.club_id || null,
    amount: xpAmount,
    source,
    source_id: sourceId,
    label,
    description,
    metadata,
    created_by: userData.user?.id || null,
  }

  const { error: historyError } = await supabase
    .from('xp_history')
    .insert(historyPayload)

  return { data, error: null, historyError }
}

export { XP_SOURCES, awardPlayerXp, calculateLevelFromXp, getNextLevelXp }
