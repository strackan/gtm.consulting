import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Terminal } from './Terminal';
import { GhostChat } from './GhostChat';
import { ActionPhase } from './ActionPhase';
import { ScoreCard } from './ScoreCard';
import { PasskeyGate } from './PasskeyGate';
import { TaleOfTheTape } from './TaleOfTheTape';
import { ScoringLoader } from './ScoringLoader';
import { Leaderboard } from './Leaderboard';
import { createGameEngine } from './GameEngine';
import { scenarios, scoringPrompts, getScenarioOutcome, getVerdict } from './scenarios';
import { lookupVisitor, scoreSession, saveSession } from './api';

const GLOBAL_MAX_QUESTIONS = 20;
const PER_SESSION_MAX_QUESTIONS = 5;
const SAVE_KEY = 'adventure_app_state';

function saveAppState(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
}

function loadAppState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function App() {
  const [mode, setMode] = useState('loading'); // loading | gate | explore | tape | ghost | action | scoring | score | leaderboard
  const [visitorProfile, setVisitorProfile] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  // Global question pool — shared across all scenarios
  const [globalQuestionCount, setGlobalQuestionCount] = useState(0);

  // Multi-scenario session tracking for combined debrief
  const [completedScenarios, setCompletedScenarios] = useState({});

  const gameEngine = useMemo(() => createGameEngine(), []);

  // Persist app-level session state after relevant changes
  useEffect(() => {
    if (mode === 'loading') return; // don't save during init
    saveAppState({
      globalQuestionCount,
      completedScenarios,
      isGuest,
      visitorSlug: visitorProfile?.slug || null,
    });
  }, [globalQuestionCount, completedScenarios, isGuest, visitorProfile, mode]);

  // Clear all adventure state from localStorage (used when switching visitors)
  function clearAllAdventureState() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('adventure_save');
    Object.keys(scenarios).forEach(id => {
      localStorage.removeItem(`ghost_played_${id}`);
    });
  }

  // Parse slug from URL path or restore saved session
  useEffect(() => {
    const path = window.location.pathname;
    const prefix = '/adventure/';
    const saved = loadAppState();

    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length).replace(/\/$/, '');
      if (slug && slug !== '' && !slug.includes('/')) {
        lookupVisitor(slug).then(profile => {
          if (profile) {
            profile.slug = slug;
            setVisitorProfile(profile);
            gameEngine.setVisitorProfile(profile);
          }
          // Restore app state only if it matches this exact slug
          if (saved && saved.visitorSlug === slug) {
            setGlobalQuestionCount(saved.globalQuestionCount || 0);
            setCompletedScenarios(saved.completedScenarios || {});
          } else {
            // Different visitor (or guest→visitor switch) — clear stale state
            clearAllAdventureState();
            gameEngine.resetState();
          }
          setMode('explore');
        });
      } else {
        // No slug in URL — check for saved session
        if (saved && localStorage.getItem('adventure_save')) {
          // Only restore if it was a guest session (no slug) or matching slug
          if (!saved.visitorSlug || saved.isGuest) {
            setGlobalQuestionCount(saved.globalQuestionCount || 0);
            setCompletedScenarios(saved.completedScenarios || {});
            setIsGuest(saved.isGuest || false);
            setMode('explore');
          } else if (saved.visitorSlug) {
            lookupVisitor(saved.visitorSlug).then(profile => {
              if (profile) {
                profile.slug = saved.visitorSlug;
                setVisitorProfile(profile);
                gameEngine.setVisitorProfile(profile);
                setGlobalQuestionCount(saved.globalQuestionCount || 0);
                setCompletedScenarios(saved.completedScenarios || {});
              }
              setMode('explore');
            });
          } else {
            setMode('gate');
          }
        } else {
          setMode('gate');
        }
      }
    } else {
      setMode('gate');
    }
  }, [gameEngine]);

  const handlePasskey = useCallback(async (slug) => {
    const profile = await lookupVisitor(slug);
    if (!profile) throw new Error('Not found');
    profile.slug = slug;
    setVisitorProfile(profile);
    gameEngine.setVisitorProfile(profile);
    setMode('explore');
  }, [gameEngine]);

  const handleGuest = useCallback(() => {
    setIsGuest(true);
    setMode('explore');
  }, []);

  const handleGhostTrigger = useCallback((scenarioId) => {
    setCurrentScenarioId(scenarioId);
    setSessionData(null);
    setMode('tape');
  }, []);

  const handleTapeReady = useCallback(() => {
    setMode('ghost');
  }, []);

  // Register ghost trigger callback so the engine knows ghost mode is available
  useEffect(() => {
    gameEngine.onGhostTrigger(handleGhostTrigger);
  }, [gameEngine, handleGhostTrigger]);

  // Expose globalQuestionCount to the game engine for status bar
  useEffect(() => {
    gameEngine.setGlobalQuestionCount(globalQuestionCount, GLOBAL_MAX_QUESTIONS);
  }, [gameEngine, globalQuestionCount]);

  const handleGhostComplete = useCallback((transcript, factsDiscovered, maxRapport) => {
    const questionsUsed = transcript.filter(m => m.role === 'user').length;
    setGlobalQuestionCount(prev => prev + questionsUsed);
    setSessionData({ transcript, factsDiscovered, maxRapport });
    setMode('action');
  }, []);

  const handleActionComplete = useCallback(async (actionChosen) => {
    setSessionData(prev => ({ ...prev, actionChosen }));
    setMode('scoring'); // Show loading screen while scoring

    // Score the session — guests use client-side scoring only (no API credits)
    let finalScores;
    const useClientScoring = isGuest;
    if (!useClientScoring) {
      try {
        const scores = await scoreSession(
          currentScenarioId,
          sessionData.transcript,
          sessionData.factsDiscovered,
          actionChosen,
          scoringPrompts[currentScenarioId]
        );
        finalScores = scores;
      } catch {
        // fall through to client-side scoring
      }
    }
    if (!finalScores) {
      // Client-side fallback scoring
      const scenario = scenarios[currentScenarioId];
      const discoveredPoints = scenario.facts
        .filter(f => sessionData.factsDiscovered.includes(f.id))
        .reduce((sum, f) => sum + f.points, 0);
      const discoveryScore = Math.min(discoveredPoints, 40);

      const actionIndex = scenario.actions.findIndex(a => a.id === actionChosen);
      const actionScore = actionIndex === 0 ? 35 : actionIndex === 1 ? 22 : actionIndex === 2 ? 18 : actionIndex === 3 ? 14 : 10;

      const questionCount = sessionData.transcript.filter(m => m.role === 'user').length;
      const factCount = sessionData.factsDiscovered.length;
      const efficiencyScore = Math.min(20, Math.round((factCount / Math.max(questionCount, 1)) * 12) + (questionCount <= 5 && factCount >= 4 ? 8 : 0));

      const missedFacts = scenario.facts
        .filter(f => !sessionData.factsDiscovered.includes(f.id) && f.tier <= 3)
        .map(f => f.label);

      const total = discoveryScore + actionScore + efficiencyScore;

      finalScores = {
        score_discovery: discoveryScore,
        score_action: actionScore,
        score_efficiency: efficiencyScore,
        score_total: total,
        missed_facts: missedFacts,
        verdict_tier: total >= 70 ? 'high' : total >= 40 ? 'mid' : 'low',
        achievements: [],
        sentiment_shift: { start: 'guarded', end: 'guarded' },
      };
    }

    // Calculate bonuses
    const scenario = scenarios[currentScenarioId];
    const bonuses = calculateBonuses(
      scenario,
      sessionData.factsDiscovered,
      sessionData.maxRapport || 2,
      sessionData.transcript,
      finalScores
    );

    // Get verdict and outcome
    const verdict = getVerdict(currentScenarioId, finalScores.score_total);
    const outcome = getScenarioOutcome(currentScenarioId, finalScores.score_total);

    const enrichedSession = {
      ...sessionData,
      actionChosen,
      scores: finalScores,
      bonuses,
      verdict,
      outcome,
    };

    setSessionData(enrichedSession);

    // Store completed scenario data
    setCompletedScenarios(prev => ({
      ...prev,
      [currentScenarioId]: enrichedSession,
    }));

    setMode('score');

    // Mark this scenario as played in localStorage
    localStorage.setItem(`ghost_played_${currentScenarioId}`, 'true');

    // Persist session to database (fire-and-forget)
    saveSession(visitorProfile?.id || null, currentScenarioId, {
      transcript: sessionData.transcript,
      facts_discovered: sessionData.factsDiscovered,
      action_chosen: actionChosen,
      score_discovery: finalScores.score_discovery,
      score_action: finalScores.score_action,
      score_efficiency: finalScores.score_efficiency,
      score_total: finalScores.score_total + bonuses.totalBonus,
      verdict: verdict,
      outcome_delta: outcome?.delta || null,
      bonuses,
    });
  }, [currentScenarioId, sessionData, isGuest, visitorProfile]);

  const handleScoreComplete = useCallback((action) => {
    if (action === 'leaderboard') {
      setMode('leaderboard');
      return;
    }

    if (action === 'restart') {
      // Clear all state and reload
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('adventure_save');
      // Clear per-scenario played flags
      Object.keys(scenarios).forEach(id => {
        localStorage.removeItem(`ghost_played_${id}`);
      });
      window.location.reload();
      return;
    }

    // 'continue' or fallback — return to game room
    setMode('explore');
    setCurrentScenarioId(null);
    setSessionData(null);
  }, []);

  const handleLeaderboardBack = useCallback(() => {
    setMode('explore');
    setCurrentScenarioId(null);
    setSessionData(null);
  }, []);

  const currentScenario = currentScenarioId ? scenarios[currentScenarioId] : null;
  const remainingQuestions = GLOBAL_MAX_QUESTIONS - globalQuestionCount;

  // Check if there are unvisited rooms with questions remaining
  const allScenarioIds = Object.keys(scenarios);
  const completedIds = Object.keys(completedScenarios);
  const unvisitedRooms = allScenarioIds.filter(id => !completedIds.includes(id));
  const hasMoreRooms = unvisitedRooms.length > 0 && remainingQuestions > 0;

  switch (mode) {
    case 'loading':
      return null;
    case 'gate':
      return (
        <PasskeyGate onPasskey={handlePasskey} onGuest={handleGuest} />
      );
    case 'explore':
      return (
        <Terminal
          gameEngine={gameEngine}
          onGhostTrigger={handleGhostTrigger}
          visitorProfile={visitorProfile}
          remainingQuestions={remainingQuestions}
          globalQuestionCount={globalQuestionCount}
          maxQuestions={GLOBAL_MAX_QUESTIONS}
        />
      );
    case 'tape':
      return (
        <TaleOfTheTape
          scenario={currentScenario}
          onReady={handleTapeReady}
        />
      );
    case 'ghost':
      return (
        <GhostChat
          scenario={currentScenario}
          visitorProfile={visitorProfile}
          onComplete={handleGhostComplete}
          maxQuestionsPerSession={PER_SESSION_MAX_QUESTIONS}
        />
      );
    case 'action':
      return (
        <ActionPhase
          scenario={currentScenario}
          factsDiscovered={sessionData.factsDiscovered}
          onComplete={handleActionComplete}
        />
      );
    case 'scoring':
      return (
        <ScoringLoader scenario={currentScenario} />
      );
    case 'score':
      return (
        <ScoreCard
          scenario={currentScenario}
          sessionData={sessionData}
          onComplete={handleScoreComplete}
          hasMoreRooms={hasMoreRooms}
        />
      );
    case 'leaderboard':
      return (
        <Leaderboard onBack={handleLeaderboardBack} />
      );
    default:
      return (
        <Terminal
          gameEngine={gameEngine}
          onGhostTrigger={handleGhostTrigger}
          visitorProfile={visitorProfile}
          remainingQuestions={remainingQuestions}
          globalQuestionCount={globalQuestionCount}
          maxQuestions={GLOBAL_MAX_QUESTIONS}
        />
      );
  }
}

/**
 * Calculate bonus points from sentiment shifts, easter eggs, and achievements.
 */
function calculateBonuses(scenario, factsDiscovered, maxRapport, transcript, scores) {
  const bonuses = {
    sentimentShift: null,
    easterEggs: [],
    achievements: [],
    totalBonus: 0,
  };

  // Sentiment shift based on maxRapport
  if (maxRapport >= 5) {
    bonuses.sentimentShift = { label: 'Full Trust', points: 15 };
    bonuses.totalBonus += 15;
  } else if (maxRapport >= 4) {
    bonuses.sentimentShift = { label: 'Made It Personal', points: 10 };
    bonuses.totalBonus += 10;
  } else if (maxRapport >= 3) {
    bonuses.sentimentShift = { label: 'Broke Through', points: 5 };
    bonuses.totalBonus += 5;
  }

  // Easter eggs — tier 4 personal facts with badges
  const tier4Facts = scenario.facts.filter(f => f.tier === 4 && f.badge);
  const discoveredBadges = new Set();
  for (const fact of tier4Facts) {
    if (factsDiscovered.includes(fact.id) && !discoveredBadges.has(fact.badge)) {
      discoveredBadges.add(fact.badge);
      bonuses.easterEggs.push({ id: fact.id, label: fact.badge, points: 3 });
      bonuses.totalBonus += 3;
    }
  }

  // Achievements — client-side detection
  const userMessages = transcript.filter(m => m.role === 'user');

  // "The Silence" — triggered a tier 3 reveal
  const tier3Facts = scenario.facts.filter(f => f.tier === 3);
  if (tier3Facts.some(f => factsDiscovered.includes(f.id))) {
    bonuses.achievements.push({ id: 'the_silence', label: 'The Silence', points: 5 });
    bonuses.totalBonus += 5;
  }

  // "First Instinct" — found a tier 2+ signal in first 3 questions
  // We check if any tier 2+ fact was discovered (since we can't track exact timing client-side,
  // we use the fact that with ≤3 questions and tier 2+ facts, they were early)
  if (userMessages.length >= 1) {
    const tier2PlusFacts = scenario.facts.filter(f => f.tier >= 2);
    const earlyDiscover = tier2PlusFacts.some(f => factsDiscovered.includes(f.id)) && userMessages.length <= 5;
    if (earlyDiscover && factsDiscovered.length > 0) {
      // Heuristic: if they found tier 2+ facts and asked ≤5 questions total, they were probing early
      bonuses.achievements.push({ id: 'first_instinct', label: 'First Instinct', points: 5 });
      bonuses.totalBonus += 5;
    }
  }

  // Server-side achievements from Claude's scoring
  if (scores.achievements && scores.achievements.length > 0) {
    for (const achId of scores.achievements) {
      // Avoid duplicates with client-side achievements
      if (!bonuses.achievements.some(a => a.id === achId)) {
        const achMap = {
          the_pivot: { label: 'The Pivot', points: 5 },
          first_instinct: { label: 'First Instinct', points: 5 },
          the_silence: { label: 'The Silence', points: 5 },
          against_the_grain: { label: 'Against the Grain', points: 5 },
          called_it: { label: 'Called It', points: 3 },
        };
        const ach = achMap[achId];
        if (ach) {
          bonuses.achievements.push({ id: achId, ...ach });
          bonuses.totalBonus += ach.points;
        }
      }
    }
  }

  return bonuses;
}

export default App;
