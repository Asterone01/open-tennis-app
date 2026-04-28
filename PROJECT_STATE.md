# OPEN App Project State

## Current Focus

Build OPEN as a mobile-first PWA for tennis communities with role-based experiences:

- Player: progress, XP, streaks, profile card, club membership.
- Coach: student evaluations and radar stat updates.
- Manager: club configuration and white-label brand kit.

## Implemented

- React/Vite app with Tailwind design tokens.
- Supabase auth with email/password login, registration, password recovery.
- Role onboarding flow: Manager, Coach, Player.
- Active role selection stored locally for dual-role usage.
- Dashboard layout with top bar, sidebar desktop, bottom nav mobile.
- Player dashboard with XP, level, streaks, daily quests, and level-up overlay.
- Player profile with radar chart and dynamic Supabase profile data.
- Join club modal for players.
- Manager dashboard with Brand Kit editor.
- White-label theme engine using CSS variables from `clubs.primary_color`.
- Club logo support in dashboard top bar.
- Coach dashboard with player evaluation sliders and +50 XP reward.
- PWA base: manifest, mobile metadata, service worker registration, and OPEN app icons.
- Competition phase: club ranking view, Face-to-Face radar comparison, and `/ranking` + `/h2h/:opponentId` routes.
- Simplified auth UX: first choose Manager/Coach/Player, then log in or register in the next screen.
- Auth category enforcement: selected login category must match account permissions; registration CTA now sits below login CTA.
- Manager player connection tools: manager can list all OPEN players, filter unassigned/my club, and attach or remove players from their club.
- Coach player connection tools: coaches linked to a club can list OPEN players and attach unassigned players to their club from the coach dashboard.
- Player club joining is resilient when the player row is missing; joining a club can create the authenticated user's `players` row before linking `club_id`.
- Hardened club linking: coach signup now creates a `players` row with `is_coach`, coaches can link themselves to a club from the coach dashboard, and the SQL sets a UUID default on `players.id` when missing.
- Extended player/coach onboarding: credentials, core profile, age group, suggested category, and club access request.
- Player Card now surfaces avatar, category, age group, and club membership status.
- Player and coach profiles surface the club they belong to.
- Coach and manager player lists can open `/players/:playerId` profile views and approve pending club requests.
- Player Card 2.0 now follows the roadmap profile wireframe with XP/rating hero metrics, stats cards, skill bars, medals, active streak placeholders, match history placeholders, and trophy placeholders.
- Canonical player skills are now the roadmap's six axes: derecha, reves, saque, volea, movilidad, and slice. Radar, skill bars, rating, H2H, and coach evaluations use the same fields.
- Player Card color is customizable per player; if unset, it uses the approved club primary color, otherwise default OPEN black.
- XP History base is in place with `xp_history`, `streaks`, a shared XP award utility, and a recent XP movements panel on Home.
- Coach evaluations now award XP through the XP ledger and recalculate level with the official XP formula.
- Coach training attendance is in place: calendar by date, scheduled sessions, duration, class plan, drill presets, approved club player roster, delete planned sessions, and close attendance with +50 XP per present player.
- Friendly matches singles base is in place: dynamic set score controls, club opponent, winner, live match flag, final player stats, opponent confirmation/rejection, and secure XP/stat award through `open_confirm_friendly_match`.
- Player profile now surfaces accumulated match stats and recent friendly match history.
- Profile photo upload is in place from the Player Card avatar, backed by Supabase Storage `profile-avatars`.
- Friendly match confirmation now updates match, win, and loss streaks and surfaces them in the player profile.
- Coach evaluation is now a guided floating modal with criteria, controlled stat deltas, reason selection, and required justification stored in XP History metadata.
- Coach evaluations create in-app notifications for the evaluated player, visible through the dashboard notification bell.
- Vercel deployment is prepared with `vercel.json` SPA rewrites.

## Supabase SQL Files

- `supabase/clubs_schema.sql`: creates `clubs` table and RLS policies.
- `supabase/gamification_schema.sql`: adds XP, level, streak columns to `players`.
- `supabase/coach_evaluations_schema.sql`: adds radar stat columns to `players`.
- `supabase/update_roles_clubs.sql`: adds `club_id` and `is_coach` to `players`.
- `supabase/players_user_id_fix.sql`: adds `user_id`, `email`, and `full_name` to `players`, then backfills `user_id` from `auth.users.email` when possible.
- `supabase/player_identity_schema.sql`: adds core identity, age group, suggested/current category, membership status, and onboarding completion fields to `players`.
- `supabase/players_access_policies.sql`: adds required player link columns (`user_id`, `club_id`, `is_coach`) when missing, backfills user links by email, then enables authenticated player reads and role-based updates for self, managers, and coaches.
- `supabase/notifications_schema.sql`: creates in-app notifications with user read/update policies and authenticated insert support.

## Important Notes

- The active player table is `public.players`.
- White-label theming is applied through `--color-brand-primary`.
- Login role selection affects the active dashboard view, but manager access remains restricted to manager accounts.
- Player with `is_coach = true` can switch between Player and Coach views.
- Keep the UI monochrome, clean, and mobile-first.

## Next Logical Step

Apply and test the new identity/onboarding base:

1. Run `supabase/player_identity_schema.sql` after `clubs_schema.sql`.
2. Re-run `supabase/players_access_policies.sql` so the consolidated policy file has every required column.
3. Test player, coach, and manager registration from the extended onboarding.
4. Confirm club requests appear as pending, then approve them from the manager/coach player list.
5. Run `supabase/notifications_schema.sql`.
6. Test one real coach evaluation and verify the XP History metadata plus the player's notification bell.
7. Authorize external deployment to Vercel, then run `npx.cmd vercel --prod --yes` or connect the repository from Vercel Dashboard.
