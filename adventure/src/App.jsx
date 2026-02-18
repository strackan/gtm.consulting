import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Terminal } from './Terminal';
import { GhostChat } from './GhostChat';
import { ActionPhase } from './ActionPhase';
import { ScoreCard } from './ScoreCard';
import { createGameEngine } from './GameEngine';
import { scenarios, scoringPrompts } from './scenarios';
import { lookupVisitor, scoreSession } from './api';

function App() {
  const [mode, setMode] = useState('explore'); // explore | ghost | action | score
  const [visitorProfile, setVisitorProfile] = useState(null);
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const gameEngine = useMemo(() => createGameEngine(), []);

  // Parse slug from URL path: /adventure/some-slug → "some-slug"
  useEffect(() => {
    const path = window.location.pathname;
    const prefix = '/adventure/';
    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length).replace(/\/$/, '');
      if (slug && slug !== '' && !slug.includes('/')) {
        lookupVisitor(slug).then(profile => {
          if (profile) {
            setVisitorProfile(profile);
            gameEngine.setVisitorProfile(profile);
          }
        });
      }
    }
  }, [gameEngine]);

  const handleGhostTrigger = useCallback((scenarioId) => {
    setCurrentScenarioId(scenarioId);
    setSessionData(null);
    setMode('ghost');
  }, []);

  const handleGhostComplete = useCallback((transcript, factsDiscovered) => {
    setSessionData({ transcript, factsDiscovered });
    setMode('action');
  }, []);

  const handleActionComplete = useCallback(async (actionChosen) => {
    setSessionData(prev => ({ ...prev, actionChosen }));

    // Score the session
    try {
      const scores = await scoreSession(
        currentScenarioId,
        sessionData.transcript,
        sessionData.factsDiscovered,
        actionChosen,
        scoringPrompts[currentScenarioId]
      );
      setSessionData(prev => ({ ...prev, actionChosen, scores }));
    } catch {
      // Fallback scoring if edge function unavailable
      const scenario = scenarios[currentScenarioId];
      const discoveredPoints = scenario.facts
        .filter(f => sessionData.factsDiscovered.includes(f.id))
        .reduce((sum, f) => sum + f.points, 0);
      const discoveryScore = Math.min(discoveredPoints, 40);

      // Simple action scoring fallback
      const actionIndex = scenario.actions.findIndex(a => a.id === actionChosen);
      const actionScore = actionIndex === 0 ? 35 : actionIndex === 1 ? 22 : actionIndex === 2 ? 18 : actionIndex === 3 ? 14 : 10;

      const questionCount = sessionData.transcript.filter(m => m.role === 'user').length;
      const factCount = sessionData.factsDiscovered.length;
      const efficiencyScore = Math.min(20, Math.round((factCount / Math.max(questionCount, 1)) * 12) + (questionCount <= 5 && factCount >= 4 ? 8 : 0));

      const missedFacts = scenario.facts
        .filter(f => !sessionData.factsDiscovered.includes(f.id) && f.tier <= 3)
        .map(f => f.label);

      setSessionData(prev => ({
        ...prev,
        actionChosen,
        scores: {
          score_discovery: discoveryScore,
          score_action: actionScore,
          score_efficiency: efficiencyScore,
          score_total: discoveryScore + actionScore + efficiencyScore,
          missed_facts: missedFacts,
        },
      }));
    }

    setMode('score');

    // Mark as played in localStorage
    localStorage.setItem('ghost_played', 'true');
    localStorage.setItem(`ghost_played_${currentScenarioId}`, 'true');
  }, [currentScenarioId, sessionData]);

  const handleScoreComplete = useCallback(() => {
    setMode('explore');
    setCurrentScenarioId(null);
    setSessionData(null);
  }, []);

  const currentScenario = currentScenarioId ? scenarios[currentScenarioId] : null;

  switch (mode) {
    case 'explore':
      return <Terminal gameEngine={gameEngine} onGhostTrigger={handleGhostTrigger} />;
    case 'ghost':
      return (
        <GhostChat
          scenario={currentScenario}
          visitorProfile={visitorProfile}
          onComplete={handleGhostComplete}
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
    case 'score':
      return (
        <ScoreCard
          scenario={currentScenario}
          sessionData={sessionData}
          onComplete={handleScoreComplete}
        />
      );
    default:
      return <Terminal gameEngine={gameEngine} onGhostTrigger={handleGhostTrigger} />;
  }
}

export default App;
