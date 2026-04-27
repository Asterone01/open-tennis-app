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

## Supabase SQL Files

- `supabase/clubs_schema.sql`: creates `clubs` table and RLS policies.
- `supabase/gamification_schema.sql`: adds XP, level, streak columns to `players`.
- `supabase/coach_evaluations_schema.sql`: adds radar stat columns to `players`.
- `supabase/update_roles_clubs.sql`: adds `club_id` and `is_coach` to `players`.
- `supabase/players_user_id_fix.sql`: adds `user_id`, `email`, and `full_name` to `players`, then backfills `user_id` from `auth.users.email` when possible.
- `supabase/players_access_policies.sql`: enables authenticated player reads and role-based updates for self, managers, and coaches.

## Important Notes

- The active player table is `public.players`.
- White-label theming is applied through `--color-brand-primary`.
- Login role selection affects the active dashboard view, but manager access remains restricted to manager accounts.
- Player with `is_coach = true` can switch between Player and Coach views.
- Keep the UI monochrome, clean, and mobile-first.

## Next Logical Step

Test and harden the mobile PWA experience:

1. Run the app on a phone from the LAN URL.
2. Confirm browser install/add-to-home-screen behavior.
3. Audit mobile layouts for login, dashboard, profile, ranking, H2H, coach, and manager views.
4. Run `supabase/players_user_id_fix.sql` first, then `supabase/players_access_policies.sql`, to unblock player/coach/manager cross-role reads and updates.
5. Add a real `rating` column or ELO calculation source in Supabase for ranking.
