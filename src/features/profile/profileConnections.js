import { supabase } from '../../lib/supabase'

function getUserRole(user, fallback = 'player') {
  return user?.user_metadata?.role || fallback
}

function toOptionalNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function buildPlayerPayload(user, overrides = {}) {
  const metadata = user?.user_metadata || {}
  const role = overrides.role || getUserRole(user)
  const payload = {
    user_id: user.id,
    email: overrides.email || user.email || '',
    full_name:
      overrides.full_name ||
      metadata.full_name ||
      metadata.nombre ||
      user.email ||
      'Jugador OPEN',
    role,
    sex: overrides.sex ?? metadata.sex ?? null,
    birth_date: overrides.birth_date || metadata.birth_date || null,
    years_playing: toOptionalNumber(
      overrides.years_playing ?? metadata.years_playing,
      0,
    ),
    is_coach: Boolean(
      overrides.is_coach ?? metadata.is_coach ?? role === 'coach',
    ),
    ...(overrides.club_id !== undefined || metadata.club_id !== undefined
      ? { club_id: overrides.club_id ?? metadata.club_id ?? null }
      : {}),
  }

  const optionalFields = [
    ['phone', overrides.phone, metadata.phone],
    ['avatar_url', overrides.avatar_url, metadata.avatar_url],
    ['player_card_color', overrides.player_card_color, metadata.player_card_color],
    ['age_group', overrides.age_group, metadata.age_group],
    ['suggested_category', overrides.suggested_category, metadata.suggested_category],
    ['current_category', overrides.current_category, metadata.current_category],
    [
      'club_membership_status',
      overrides.club_membership_status,
      metadata.club_membership_status,
    ],
    ['onboarding_completed', overrides.onboarding_completed, metadata.onboarding_completed],
    [
      'onboarding_completed_at',
      overrides.onboarding_completed_at,
      metadata.onboarding_completed_at,
    ],
  ]

  optionalFields.forEach(([key, overrideValue, metadataValue]) => {
    if (overrideValue !== undefined || metadataValue !== undefined) {
      payload[key] = overrideValue ?? metadataValue ?? null
    }
  })

  return payload
  }

function shouldRetryWithGeneratedId(error) {
  return (
    error?.code === '23502' &&
    error?.message?.toLowerCase().includes('column "id"')
  )
}

function createGeneratedId(payload) {
  return window.crypto?.randomUUID?.() || payload.user_id
}

async function insertPlayerProfile(payload) {
  const response = await supabase.from('players').insert(payload).select().single()

  if (!response.error || !shouldRetryWithGeneratedId(response.error)) {
    return response
  }

  return supabase
    .from('players')
    .insert({
      id: createGeneratedId(payload),
      ...payload,
    })
    .select()
    .single()
}

async function ensurePlayerProfile(user, overrides = {}) {
  if (!user?.id) {
    return { data: null, error: null }
  }

  const role = overrides.role || getUserRole(user)
  const shouldHavePlayerRow =
    overrides.force || role === 'player' || role === 'coach' || overrides.is_coach

  if (!shouldHavePlayerRow) {
    return { data: null, error: null }
  }

  const payload = buildPlayerPayload(user, overrides)
  const { data: existingPlayer, error: lookupError } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (lookupError) {
    return { data: null, error: lookupError }
  }

  if (existingPlayer?.id) {
    return supabase
      .from('players')
      .update(payload)
      .eq('id', existingPlayer.id)
      .select()
      .single()
  }

  return insertPlayerProfile(payload)
}

export { buildPlayerPayload, ensurePlayerProfile, getUserRole }
