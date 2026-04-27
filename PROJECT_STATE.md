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

## Supabase SQL Files

- `supabase/clubs_schema.sql`: creates `clubs` table and RLS policies.
- `supabase/gamification_schema.sql`: adds XP, level, streak columns to `players`.
- `supabase/coach_evaluations_schema.sql`: adds radar stat columns to `players`.
- `supabase/update_roles_clubs.sql`: adds `club_id` and `is_coach` to `players`.

## Important Notes

- The active player table is `public.players`.
- White-label theming is applied through `--color-brand-primary`.
- Login role selection affects the active dashboard view, but manager access remains restricted to manager accounts.
- Player with `is_coach = true` can switch between Player and Coach views.
- Keep the UI monochrome, clean, and mobile-first.

## Next Logical Step

Make the app installable as a true PWA:

1. Add web app manifest.
2. Add mobile icons and theme color.
3. Add service worker registration.
4. Test mobile viewport and install prompt behavior.
5. Commit and push changes to GitHub.
