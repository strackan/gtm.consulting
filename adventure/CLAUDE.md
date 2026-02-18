# GTM Adventure

Interactive adventure/demo experience for GTM Consulting with ghost customer simulation.

## Tech Stack
- React 18.2, Vite 5
- Supabase edge functions (renubu cloud instance) for Claude API proxy + scoring
- Minimal dependency footprint (React + ReactDOM only)

## PM2
- **Name:** `powerpak:gtm-adventure`
- **Dev port:** 4301
- **Start:** `pm2 start ecosystem.config.js --only powerpak:gtm-adventure`

## Commands
```bash
pm2 start ecosystem.config.js --only powerpak:gtm-adventure  # Dev server (port 4301)
npm run build    # Production build
```

## Architecture

### Game Modes
- **explore**: Text adventure (Terminal.jsx + GameEngine.js)
- **ghost**: AI-powered customer interview (GhostChat.jsx)
- **action**: Choose your response (ActionPhase.jsx)
- **score**: Results breakdown (ScoreCard.jsx)

### Scenarios (adventure/src/scenarios.js)
4 ghost customers in the game room, mapped to game objects:
- **chess** → Tommy Flores (The Acquisition Play)
- **dartboard** → Reena Okafor (The Budget Guillotine)
- **puzzle** → Deck Morrison (The Midnight Prototype)
- **cards** → Maggie Whitfield (The Legacy)

### Supabase Edge Functions (renubu/renubu/supabase/functions/)
- `adventure-ghost-chat` — Claude streaming proxy (claude-sonnet-4-6, temp 0.8)
- `adventure-score` — Session scoring via Claude
- `adventure-lookup` — Resolves URL slug → visitor profile
- `adventure-create-visitor` — Generates personalized URLs

### Supabase Tables
- `adventure_visitors` — Personalized URL slugs + visitor profiles
- `adventure_sessions` — Play history + scores

### URL Format
Clean URLs: `/adventure/true-wind` (not query params). Vercel rewrites handle SPA routing.

### Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### One-Play Gate
After completing any ghost scenario, `localStorage.ghost_played = true` prevents replays.
Replay codes are managed per-visitor in Supabase.
