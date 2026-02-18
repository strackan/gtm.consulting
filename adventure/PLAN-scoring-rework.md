# Adventure Scoring Rework — Implementation Plan

## Overview

Rework the ghost customer simulation scoring from a generic point-based system to a **baseline-delta model** where each scenario has a defined "actual outcome" (score = 50), and the player's score reflects how much they improved (or worsened) reality. Add bonus achievements, ghost verdicts, and a shareable debrief card.

---

## 1. Baseline Outcomes (add to scenarios.js)

Each scenario gets a `baselineOutcome` object:

### Tommy (Chess) — 50 = Flat renewal, political stalemate
- **What happened:** Tommy fought the internal battle alone. Board meeting ended in compromise: his original 200 users keep your product, acquired company's 400 users keep their tool. Split stack. No expansion, no churn. Tommy's exhausted, resentful no one from your side helped.
- **70+:** Helped him build ROI case → unified rollout, 400 new users
- **90+:** Presented to combined leadership → Tommy credited, career saved
- **30-:** Contacted acquired CTO directly → Tommy lost political cover, full rip-and-replace

### Reena (Dartboard) — 50 = Survived the cut, barely. Watch list.
- **What happened:** Reena cut 2 of 5 vendor tools. Lobbied to keep yours because she likes the product and likes you. But it's on the "watch list" for Q2 budget review. No growth. Stressed, feels alone.
- **70+:** Gave her ROI data + connected new team → off watch list, expansion
- **90+:** Reena pitched to VP with your help → promoted, you're the platform play
- **30-:** Pushed too hard on renewal while she was drowning → cut in Q2

### Deck (Puzzle) — 50 = Lost the prototype, kept main contract
- **What happened:** Deck ran the bake-off. Competitor's SE was faster on prototype, won that work. But competitor couldn't scale for core use case, so main contract survived. Deck respects you grudgingly, thinks your team is too slow.
- **70+:** Matched competitor technically → won prototype, full expansion
- **90+:** Became Deck's build partner → he evangelized to CEO, 3x deal
- **30-:** Sent "let me loop in my SE" email → Deck went all-in on competitor, lost everything

### Maggie (Cards) — 50 = Partial churn. Lost main deal, kept one unit.
- **What happened:** New CEO pushed rip-and-replace for primary deployment. Maggie fought but didn't have enough ammunition. Negotiated to keep your product in one department where migration risk was too high. Quietly bitter. Retiring in 18 months with unfinished business.
- **70+:** Armed Maggie with ROI + patient engagement angle → changed the argument
- **90+:** Maggie pitched expansion to new CEO → strategic partner, legacy cemented
- **30-:** Went around Maggie to new CEO → she felt disrespected, helped migration succeed out of spite

---

## 2. Ghost System Prompt Updates (scenarios.js)

Add to each character's system prompt:

```
## What Actually Happened (YOUR MEMORY — NEVER VOLUNTEER THIS)
[baseline outcome text]

You know how this story ended. It haunts you. But you are FORBIDDEN from
telling the player what happened. You can:
- Show emotion that hints at the outcome (bitterness, resignation, hope)
- React strongly when a question touches on what actually went wrong
- Say things like "I wish someone had asked me that back then"
- NEVER say "here's what happened" or directly reveal the outcome
```

---

## 3. Scoring Model Changes

### Core Score (0-100, anchored to baseline)

**Discovery (0-40)** — unchanged in structure, but facts now tagged with whether they'd change the outcome:
- `outcome_changing: true` on facts that, if discovered, shift the result away from baseline
- Expansion signals worth more than risk signals (existing behavior)

**Action (0-40)** — scored as delta from baseline:
- Action that improves on reality: 25-40
- Action that matches reality (what most people would do): 15-24
- Action that's worse than reality: 0-14
- Each scenario's scoring rubric updated with baseline-aware descriptions

**Efficiency (0-20)** — unchanged

### Outcome Bands (per scenario, not generic)

Replace the generic `resultLabels` array with per-scenario outcome descriptions:

```javascript
scenarios.chess.outcomes = [
  { min: 90, label: "Unified rollout. 400 new users. Tommy's buying you a steak.", delta: "Flat renewal → 3x expansion" },
  { min: 70, label: "Won the rollout. Tommy has his ammunition.", delta: "Flat renewal → Full expansion" },
  { min: 50, label: "Split stack compromise. Same as reality.", delta: "No change" },
  { min: 30, label: "Tommy lost political cover. Account at risk.", delta: "Flat renewal → At risk" },
  { min: 0, label: "Full rip-and-replace. Tommy's updating his resume.", delta: "Flat renewal → Total loss" },
];
```

The `delta` field powers the "Reality → You" line on the debrief card.

---

## 4. Bonus System (new)

### Data Structure

```javascript
// Added to session tracking in App.jsx
bonuses: {
  sentimentShift: { from: "guarded", to: "vulnerable", points: 15 },
  easterEggs: [
    { id: "tommy_divorce", label: "Tommy's divorce", points: 3 },
  ],
  achievements: [
    { id: "broke_through", label: "Broke Through", points: 5 },
    { id: "first_instinct", label: "First Instinct", points: 5 },
  ],
  totalBonus: 28,
}
```

### Sentiment Shift (tracked via rapport_level metadata from Claude)
- `+5` "Broke Through" — rapport moved from 0-1 → 2-3
- `+10` "Made It Personal" — rapport moved from 2-3 → 4-5
- `+15` "Full Trust" — hit rapport level 5

Implementation: GhostChat.jsx already tracks `rapport_level` from metadata. Add a `maxRapport` state that records the highest rapport achieved. Calculate bonus at end of conversation.

### Easter Eggs (Tier 4 personal facts)
- `+3` per personal detail unlocked
- Each gets a named badge: "After Bedtime" (Deck's daughter), "Empty House" (Tommy's divorce), "1am Drafts" (Reena's mom), "Dear Jim" (Maggie's husband)
- Already tracked in `factsDiscovered` — just need to tag tier 4 facts with badge names

Add to each scenario's facts array:
```javascript
{ id: "tommy_divorce", tier: 4, points: 2, label: "Tommy's going through a divorce", badge: "Empty House" }
```

### Conversation Achievements
Detected either client-side (from transcript patterns) or by Claude during scoring:

- **"The Pivot" (+5)** — First 3 questions were generic (tier 1 reveals only), then shifted to specific probing. Detected by checking if tier 2+ facts were only discovered after question 3.
- **"First Instinct" (+5)** — Found a tier 2+ signal in first 3 questions. Check factsDiscovered timing.
- **"The Silence" (+5)** — Triggered a tier 3 reveal. These are the hard-to-get facts. If any tier 3 fact is in factsDiscovered, award this.
- **"Against the Grain" (+5)** — Chose an action that's unconventional but high-scoring. Tag specific actions per scenario.
- **"Called It" (+3)** — Asked directly about the core issue (each scenario defines 1-2 "direct ask" trigger phrases in the system prompt).

Implementation: Most of these can be calculated client-side from the transcript and factsDiscovered data. "Called It" needs Claude to flag it during scoring.

---

## 5. Ghost Verdicts (new)

Each scenario defines verdict tiers:

```javascript
scenarios.chess.verdicts = {
  high: '"You remind me of my old CO. Straight shooter. I\'d take that call."',
  mid: '"At least you showed up. Most people just send an email."',
  low: '"Another vendor checking a box."',
};
```

### All Verdicts:

**Tommy:**
- High (70+): "You remind me of my old CO. Straight shooter. I'd take that call."
- Mid (40-69): "At least you showed up. Most people just send an email."
- Low (<40): "Another vendor checking a box."

**Reena:**
- High (70+): "I wish you'd been the one I called when this started."
- Mid (40-69): "You asked the right questions. Just... not soon enough."
- Low (<40): "You asked all the right questions... for a different customer."

**Deck:**
- High (70+): "Okay. You can keep up. Let's build."
- Mid (40-69): "You're not as clueless as most vendor reps. That's something."
- Low (<40): "I gave you three chances to impress me. You sent me a calendar link."

**Maggie:**
- High (70+): "In thirty years, I've worked with two people who truly listened. You might be the third."
- Mid (40-69): "You have good instincts, dear. You just need more time in the chair."
- Low (<40): "Dear [Name], Thank you for your time. Best regards."

---

## 6. Debrief Card (ScoreCard.jsx rewrite)

Replace the current ScoreCard with a multi-scenario debrief view:

```
┌─────────────────────────────────────────────┐
│  GTM.CONSULTANT — DEBRIEF                   │
│  Player: Justin Strackany                   │
├─────────────────────────────────────────────┤
│                                             │
│  TOMMY FLORES        72/100  ████████░░     │
│  "You remind me of my old CO."              │
│  Reality: Flat renewal → You: Full rollout  │
│  [badges: Broke Through, The Pivot]         │
│                                             │
│  REENA OKAFOR        58/100  █████░░░░░     │
│  "You asked the right questions...          │
│   for a different customer."                │
│  Reality: Watch list → You: Still watch list│
│                                             │
│  DECK MORRISON       84/100  █████████░     │
│  "Okay. You can keep up. Let's build."      │
│  Reality: Lost prototype → You: Won bake-off│
│  [badges: First Instinct, Called It,        │
│   Easter Egg: "After Bedtime"]              │
│                                             │
│  MAGGIE WHITFIELD    — skipped —            │
│                                             │
├─────────────────────────────────────────────┤
│  OVERALL: 71                                │
│  "You left money on the table, but the      │
│   customers noticed you were listening."    │
│                                             │
│  Bonuses: +28 (Sentiment: 2, Eggs: 1,      │
│  Achievements: 3)                           │
│                                             │
│  WHAT YOU MISSED:                           │
│  Tommy's fighting for his career, not just  │
│  your product. Reena's mom has MS. You      │
│  never talked to Maggie.                    │
│                                             │
│  "What would you have done differently?"    │
├─────────────────────────────────────────────┤
│  gtm.consulting/adventure                   │
│  Built by Renubu — the signals were there   │
└─────────────────────────────────────────────┘
```

NOTE: The debrief card currently shows after each individual scenario. For the multi-scenario debrief, we need to decide:
- Option A: Show individual ScoreCard after each scenario, then a combined debrief after all 4 (or after questions run out if using shared pool)
- Option B: Only show the combined debrief at the end
- **Recommend Option A** — immediate feedback per scenario keeps engagement, combined debrief is the shareable moment

---

## 7. Shared Question Pool (from welcome letter)

The proposed welcome letter describes "10 questions spread across all four customers." This is a significant mechanic change:

### Current: 10 questions per scenario, one-play gate after first scenario
### Proposed: 10 questions TOTAL across all scenarios

Implementation:
- Add `globalQuestionCount` state to App.jsx (persists across ghost sessions)
- GhostChat receives `remainingQuestions` prop instead of using `maxQuestions = 10`
- Player can leave a conversation early ("LEAVE" or "DONE") to save questions for other customers
- When global count hits 10, ALL remaining scenarios auto-close
- One-play gate remains but now triggers after the debrief (not after first scenario)

### Question Distribution UI
Show remaining questions in the status bar when in explore mode:
```
The Game Room          Questions: 7/10 remaining          Score: 25
```

---

## 8. Multi-Room Layout (from welcome letter)

The letter says "each customer is in a different room." Currently all 4 are objects in `game_room`.

### Option A: Separate rooms (matches letter)
- Create 4 rooms: `tommy_room`, `reena_room`, `deck_room`, `maggie_room`
- Game room becomes a hub with 4 doors
- Each room has atmospheric description matching the character

### Option B: Keep single room (simpler)
- Rewrite letter to match ("four customers sit in different corners of the room")

**Recommend Option A** — separate rooms add atmosphere and pacing. Each room can have character-specific objects and descriptions that hint at who they are before you start the conversation.

Room descriptions (brief):
- **Tommy's room:** Leather chair, military coin on the desk, black coffee gone cold. Memphis Grizzlies mug.
- **Reena's room:** Standing desk, 3 monitors, draft emails visible on screen. A framed photo of her family.
- **Deck's room:** Bass guitar in the corner, terminal with code scrolling. A child's drawing taped to the monitor.
- **Maggie's room:** Mahogany desk, framed degrees, a photo of Jim. Coffee mug that says "I Survived Y2K."

---

## 9. Welcome Letter Update (scenarios.js)

Replace `getMailboxMessage()` with the new letter (adapted to match implemented mechanics):

```
Greetings {First},

Thanks for playing my little game. I hope you like it!

Here's how it works:

Inside this cottage are 4 real customers who, unfortunately, no longer do
business with your company. Each one churned — or nearly churned — for a
different reason. Each one is a different kind of person with different
motivations, frustrations, and communication styles.

However, due to a strange electrical storm (don't ask), time has folded
back on itself, and you've been given a rare second chance.

You get 10 questions.

That's it. Ten questions spread across all four customers. You can
distribute them however you want — blow all 10 on one customer, spread
them evenly, or skip someone entirely. It's your call.

Each customer is in a different room of the cottage. You can visit them
in any order. When you enter a room, you'll learn a little about who
they are. Then you start asking.

Your goal: Change the outcome.

Each of these customers had a real ending. Some churned. Some stayed but
barely. Your score reflects whether you can do better than what actually
happened — or worse.

After your 10 questions are up, you'll see your debrief: what actually
happened, what you changed, and what you missed.

A few things to know:

The questions you ask matter more than the answers you get. These
customers are watching how you engage, not just what you say. Ask
something selfish, they'll notice. Ask something that shows you actually
listened, they'll notice that too.

You won't have access to a CRM, usage data, or internal notes. All you
have is what they tell you — and what you can pick up between the lines.

Ready?

Type LOOK AROUND to see the cottage, or HELP for commands.

Good luck, {First}. They're waiting for you.

— The Consultant

[GTM.CONSULTANT is an interactive training experience. Your choices and
outcomes are tracked and will be reviewed in your debrief session.]
```

---

## 10. Scoring Edge Function Update (adventure-score)

The `adventure-score` edge function needs updated prompts:

- Include baseline outcome in the scoring context
- Ask Claude to score as delta from baseline
- Ask Claude to detect achievements ("The Pivot", "Called It", etc.)
- Ask Claude to select the appropriate ghost verdict
- Return enriched response:

```json
{
  "score_discovery": 28,
  "score_action": 32,
  "score_efficiency": 12,
  "score_total": 72,
  "outcome_delta": "Flat renewal → Full rollout",
  "verdict": "You remind me of my old CO. Straight shooter. I'd take that call.",
  "achievements": ["broke_through", "the_pivot"],
  "missed_facts": ["Tommy's going through a divorce", "Tommy bet his career on your product"],
  "sentiment_shift": { "start": "guarded", "end": "open" }
}
```

---

## 11. Session Storage Update (Supabase)

Update `adventure_sessions` table or add columns:
- `bonuses jsonb` — achievements, easter eggs, sentiment data
- `verdict text` — ghost's one-liner
- `outcome_delta text` — "Reality → You" summary
- `baseline_score int default 50` — reference point

Migration file: `20260219000000_adventure_scoring_v2.sql`

---

## 12. Implementation Order

### Phase 1: Scoring Foundation
1. Add baseline outcomes + verdicts + outcome bands to `scenarios.js`
2. Update ghost system prompts with "what actually happened" memory
3. Update scoring rubrics in `scoringPrompts` with baseline-aware descriptions
4. Update `adventure-score` edge function with enriched response

### Phase 2: Bonus System
5. Add badge metadata to tier 4 facts in scenarios.js
6. Add achievement detection logic (client-side in App.jsx)
7. Track sentiment shift in GhostChat.jsx (maxRapport state)
8. Wire bonuses into session data

### Phase 3: Debrief Card
9. Rewrite ScoreCard.jsx with verdict, delta, badges, debrief layout
10. Add per-scenario outcome descriptions
11. Add "What You Missed" with baseline context
12. Add shareable footer with Renubu tagline

### Phase 4: Shared Question Pool
13. Add globalQuestionCount to App.jsx
14. Update GhostChat to accept remainingQuestions prop
15. Add "LEAVE"/"DONE" command to exit ghost early
16. Update one-play gate to trigger after debrief, not first scenario
17. Show remaining questions in Terminal status bar

### Phase 5: Multi-Room Layout
18. Create 4 character rooms in locations.json
19. Update game_room to be a hub with 4 doors
20. Move ghost triggers from object examination to room entry
21. Add atmospheric room descriptions

### Phase 6: Welcome Letter
22. Update getMailboxMessage() with new letter text
23. Update default (non-personalized) letter in objects.json

### Phase 7: Polish + Storage
24. Supabase migration for new columns
25. Update adventure-score to save enriched data
26. Animation polish on debrief card
27. "Share your debrief" text formatting for LinkedIn

---

## 13. Files to Modify

| File | Changes |
|------|---------|
| `adventure/src/scenarios.js` | Baseline outcomes, verdicts, outcome bands, badge metadata, updated scoring prompts, new letter |
| `adventure/src/App.jsx` | Shared question pool state, bonus tracking, multi-scenario session data |
| `adventure/src/GhostChat.jsx` | remainingQuestions prop, maxRapport tracking, early exit command |
| `adventure/src/ScoreCard.jsx` | Full rewrite — debrief card with verdicts, deltas, badges |
| `adventure/src/Terminal.jsx` | Questions remaining in status bar |
| `adventure/src/GameEngine.js` | Multi-room triggers, hub room logic |
| `adventure/content/locations.json` | 4 new character rooms, game_room as hub |
| `adventure/content/objects.json` | Room-specific objects per character |
| `adventure/src/styles.css` | Debrief card styles, badge styles |
| `supabase/functions/adventure-score/index.ts` | Enriched scoring with verdicts, achievements, deltas |
| `supabase/migrations/` | New migration for scoring v2 columns |

---

## 14. Current State Reminder

What's already deployed and working:
- 4 ghost scenarios with tiered facts and Claude-powered conversations
- Streaming chat with chess clock timer (5 min) and 10 question limit per scenario
- Action phase with 5 choices per scenario
- ScoreCard with animated results (discovery/action/efficiency)
- One-play gate (localStorage)
- Personalized URLs via adventure-create-visitor edge function
- "Welcome, [First]" in status bar
- Supabase tables (adventure_visitors, adventure_sessions)
- 4 edge functions deployed (ghost-chat, score, lookup, create-visitor)
- Vercel deployment with Vite build
- "Create Adventure Slug" button in GuyForThat CRM contact view

### Pending from this session (not yet pushed):
- "look in" → open command mapping (GameEngine.js) — committed but not pushed
- Welcome status bar (Terminal.jsx) — committed and pushed
