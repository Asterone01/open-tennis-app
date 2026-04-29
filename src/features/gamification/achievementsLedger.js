import { supabase } from '../../lib/supabase'

// Full catalog — keys must match DB achievement_key values
export const ACHIEVEMENTS_CATALOG = {
  // Activity
  primer_paso: {
    key: 'primer_paso',
    name: 'Primer Paso',
    description: 'Juega tu primer partido confirmado',
    rarity: 'common',
  },
  entrenador_comprometido: {
    key: 'entrenador_comprometido',
    name: 'Entrenador Comprometido',
    description: 'Asiste a 5 entrenamientos seguidos',
    rarity: 'silver',
  },
  maquina_entrenos: {
    key: 'maquina_entrenos',
    name: 'Maquina de Entrenos',
    description: 'Asiste a 20 entrenamientos en un mes',
    rarity: 'gold',
  },
  debutante_torneos: {
    key: 'debutante_torneos',
    name: 'Debutante en Torneos',
    description: 'Participa en tu primer torneo',
    rarity: 'common',
  },
  tornamentista: {
    key: 'tornamentista',
    name: 'Tornamentista',
    description: 'Participa en 3 torneos',
    rarity: 'silver',
  },
  campeon: {
    key: 'campeon',
    name: 'Campeon',
    description: 'Gana tu primer torneo',
    rarity: 'gold',
  },
  tricampeon: {
    key: 'tricampeon',
    name: 'Tricampeon',
    description: 'Gana 3 torneos',
    rarity: 'gold',
  },
  // Rachas
  ganador: {
    key: 'ganador',
    name: 'Ganador',
    description: '3 victorias seguidas en partidos amistosos',
    rarity: 'silver',
  },
  racha_legendaria: {
    key: 'racha_legendaria',
    name: 'Racha Legendaria',
    description: '10 victorias seguidas en partidos amistosos',
    rarity: 'gold',
  },
  perseverante: {
    key: 'perseverante',
    name: 'Perseverante',
    description: 'Pierdes un partido y juegas otro en las siguientes 24 horas',
    rarity: 'common',
  },
  resiliencia: {
    key: 'resiliencia',
    name: 'Resiliencia',
    description: 'Despues de una derrota, ganas 5 partidos seguidos',
    rarity: 'silver',
  },
  // Progreso de categoria
  promesa: {
    key: 'promesa',
    name: 'Promesa',
    description: 'Sube de categoria D a C',
    rarity: 'silver',
  },
  en_ascenso: {
    key: 'en_ascenso',
    name: 'En Ascenso',
    description: 'Sube de categoria C a B',
    rarity: 'silver',
  },
  elite_confirmada: {
    key: 'elite_confirmada',
    name: 'Elite Confirmada',
    description: 'Sube de categoria B a A',
    rarity: 'gold',
  },
  profesional: {
    key: 'profesional',
    name: 'Profesional',
    description: 'Sube de categoria A a Pro',
    rarity: 'gold',
  },
  // Estadisticas
  ace_master: {
    key: 'ace_master',
    name: 'Ace Master',
    description: '100 aces acumulados en partidos con juez',
    rarity: 'silver',
  },
  golden_arm: {
    key: 'golden_arm',
    name: 'Golden Arm',
    description: '50 winners en un mes',
    rarity: 'silver',
  },
  // Comunidad
  gregario: {
    key: 'gregario',
    name: 'Gregario',
    description: 'Juega contra 3 rivales distintos',
    rarity: 'common',
  },
  mentor: {
    key: 'mentor',
    name: 'Mentor',
    description: 'Un alumno tuyo sube de categoria',
    rarity: 'silver',
  },
}

// All keys ordered for display (locked ones appear grayed-out)
export const ACHIEVEMENTS_ORDER = [
  'primer_paso',
  'entrenador_comprometido',
  'maquina_entrenos',
  'ganador',
  'racha_legendaria',
  'perseverante',
  'resiliencia',
  'gregario',
  'promesa',
  'en_ascenso',
  'elite_confirmada',
  'profesional',
  'debutante_torneos',
  'tornamentista',
  'campeon',
  'tricampeon',
  'ace_master',
  'golden_arm',
  'mentor',
]

export async function getPlayerAchievements(playerId) {
  const { data } = await supabase
    .from('player_achievements')
    .select('*')
    .eq('player_id', String(playerId))
    .order('unlocked_at', { ascending: false })

  return data || []
}

async function getUnlockedKeys(playerId) {
  const { data } = await supabase
    .from('player_achievements')
    .select('achievement_key')
    .eq('player_id', String(playerId))

  return new Set((data || []).map((r) => r.achievement_key))
}

async function unlockOne({ playerId, userId, clubId, achievementKey }) {
  const def = ACHIEVEMENTS_CATALOG[achievementKey]
  if (!def) return null

  const { data, error } = await supabase
    .from('player_achievements')
    .insert({
      player_id: String(playerId),
      user_id: userId || null,
      achievement_key: achievementKey,
      name: def.name,
      description: def.description,
      rarity: def.rarity,
    })
    .select()
    .single()

  // Unique constraint violation = already unlocked, not a real error
  if (error) return null

  // In-app notification
  if (userId) {
    await supabase.from('notifications').insert({
      user_id: userId,
      actor_user_id: userId,
      player_id: String(playerId),
      club_id: clubId || null,
      type: 'achievement_unlocked',
      title: `Medalla desbloqueada: ${def.name}`,
      body: def.description,
      href: '/dashboard/profile',
      metadata: { achievement_key: achievementKey, rarity: def.rarity },
    })
  }

  return data
}

/**
 * Main entry point. Call after any significant game event.
 *
 * context shapes:
 *   matchConfirmed:  { totalConfirmedMatches, winStreak, distinctOpponentCount, hadRecentLoss, winStreakAfterLoss, totalAces }
 *   trainingClosed:  { trainingStreak, monthlyAttendance }
 *   categoryPromoted:{ from, to }
 *   mentorPromotion: true
 *   tournament:      { totalParticipations, totalWins }
 */
export async function checkAndUnlockAchievements({ player, userId, context = {} }) {
  if (!player?.id) return []

  const playerId = player.id
  const clubId = player.club_id || null
  const alreadyUnlocked = await getUnlockedKeys(playerId)
  const toUnlock = []

  const maybe = (key) => {
    if (!alreadyUnlocked.has(key)) toUnlock.push(key)
  }

  // Match events
  if (context.matchConfirmed) {
    const {
      totalConfirmedMatches = 0,
      winStreak = 0,
      distinctOpponentCount = 0,
      hadRecentLoss = false,
      winStreakAfterLoss = 0,
      totalAces = 0,
    } = context.matchConfirmed

    if (totalConfirmedMatches >= 1) maybe('primer_paso')
    if (winStreak >= 3) maybe('ganador')
    if (winStreak >= 10) maybe('racha_legendaria')
    if (distinctOpponentCount >= 3) maybe('gregario')
    if (hadRecentLoss) maybe('perseverante')
    if (winStreakAfterLoss >= 5) maybe('resiliencia')
    if (totalAces >= 100) maybe('ace_master')
  }

  // Training events
  if (context.trainingClosed) {
    const { trainingStreak = 0, monthlyAttendance = 0 } = context.trainingClosed
    if (trainingStreak >= 5) maybe('entrenador_comprometido')
    if (monthlyAttendance >= 20) maybe('maquina_entrenos')
  }

  // Category promotion
  if (context.categoryPromoted) {
    const { from, to } = context.categoryPromoted
    if (from === 'D' && to === 'C') maybe('promesa')
    if (from === 'C' && to === 'B') maybe('en_ascenso')
    if (from === 'B' && to === 'A') maybe('elite_confirmada')
    if (from === 'A' && to === 'Pro') maybe('profesional')
  }

  // Coach mentoring
  if (context.mentorPromotion) maybe('mentor')

  // Tournament events
  if (context.tournament) {
    const { totalParticipations = 0, totalWins = 0 } = context.tournament
    if (totalParticipations >= 1) maybe('debutante_torneos')
    if (totalParticipations >= 3) maybe('tornamentista')
    if (totalWins >= 1) maybe('campeon')
    if (totalWins >= 3) maybe('tricampeon')
  }

  const unlocked = []
  for (const key of toUnlock) {
    const result = await unlockOne({ playerId, userId, clubId, achievementKey: key })
    if (result) unlocked.push(result)
  }

  return unlocked
}
