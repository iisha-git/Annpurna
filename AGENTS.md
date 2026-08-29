# Annpurna — repo notes

## Git workflow

- Commit and push ONLY after a complete change or a new feature/milestone.
- No per-edit, per-file, or "WIP" commits.
- Keep commits focused and message style conventional (`feat(scope): …`, `fix: …`, `chore: …`).
- Never commit real `.env` files, secrets, or local config. `.env.example` placeholders are the only env files that belong in the repo.

## Project layout

- `apps/api` — MongoDB backend (Express + Mongoose, JWT auth).
- `apps/student` — Expo React Native student app.
- `apps/owner-panel` — React + Vite owner web panel.