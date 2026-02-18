import React, { useState, useEffect, useRef } from 'react';
import { getResultLabel } from './scenarios';

export function ScoreCard({ scenario, sessionData, onComplete }) {
  const [revealed, setRevealed] = useState(0); // 0=nothing, 1=verdict, 2=scores, 3=delta+badges, 4=missed, 5=cta
  const [animatedScores, setAnimatedScores] = useState({ discovery: 0, action: 0, efficiency: 0, total: 0 });
  const outputRef = useRef(null);

  const scores = sessionData.scores || {
    score_discovery: 0,
    score_action: 0,
    score_efficiency: 0,
    score_total: 0,
    missed_facts: [],
  };

  const verdict = sessionData.verdict || null;
  const outcome = sessionData.outcome || null;
  const bonuses = sessionData.bonuses || { sentimentShift: null, easterEggs: [], achievements: [], totalBonus: 0 };

  // Progressive reveal animation
  useEffect(() => {
    const timers = [
      setTimeout(() => setRevealed(1), 500),
      setTimeout(() => setRevealed(2), 2000),
      setTimeout(() => setRevealed(3), 3500),
      setTimeout(() => setRevealed(4), 5000),
      setTimeout(() => setRevealed(5), 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Score counter animation
  useEffect(() => {
    if (revealed < 2) return;

    const duration = 1200;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      setAnimatedScores({
        discovery: Math.round(scores.score_discovery * ease),
        action: Math.round(scores.score_action * ease),
        efficiency: Math.round(scores.score_efficiency * ease),
        total: Math.round(scores.score_total * ease),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [revealed, scores]);

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [revealed]);

  function renderBar(value, max) {
    const width = 30;
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  }

  const actionLabel = scenario.actions.find(a => a.id === sessionData.actionChosen)?.label || sessionData.actionChosen;

  // Determine score color class
  const scoreColor = scores.score_total >= 70 ? 'score-high' : scores.score_total >= 40 ? 'score-mid' : 'score-low';

  return (
    <div className="terminal score-card">
      <div className="score-header">
        <span className="score-title">DEBRIEF</span>
        <span className="score-scenario">{scenario.character.name} — {scenario.headline}</span>
      </div>

      <div className="output score-output" ref={outputRef}>
        {/* Verdict — the ghost's one-liner */}
        {revealed >= 1 && verdict && (
          <div className="score-verdict fade-in">
            <div className="score-verdict-name">{scenario.character.name}</div>
            <div className="score-verdict-quote">{verdict}</div>
          </div>
        )}

        {/* Score Breakdown */}
        {revealed >= 2 && (
          <div className="score-breakdown fade-in">
            <div className="score-row">
              <span className="score-category">Discovery</span>
              <span className="score-bar">{renderBar(animatedScores.discovery, 40)}</span>
              <span className="score-value">{animatedScores.discovery}/40</span>
            </div>
            <div className="score-row">
              <span className="score-category">Action</span>
              <span className="score-bar">{renderBar(animatedScores.action, 40)}</span>
              <span className="score-value">{animatedScores.action}/40</span>
            </div>
            <div className="score-row">
              <span className="score-category">Efficiency</span>
              <span className="score-bar">{renderBar(animatedScores.efficiency, 20)}</span>
              <span className="score-value">{animatedScores.efficiency}/20</span>
            </div>
            <div className="score-divider">{'─'.repeat(50)}</div>
            <div className={`score-row score-total-row ${scoreColor}`}>
              <span className="score-category">TOTAL</span>
              <span className="score-bar"></span>
              <span className="score-value score-total-value">{animatedScores.total}/100</span>
            </div>

            <div className="score-action-taken">
              <span className="score-action-label">Your move:</span> {actionLabel}
            </div>
          </div>
        )}

        {/* Delta + Badges */}
        {revealed >= 3 && (
          <div className="score-delta-section fade-in">
            {/* Outcome Delta */}
            {outcome && outcome.delta && (
              <div className="score-delta">
                <span className="score-delta-label">Reality → You:</span>
                <span className="score-delta-value">{outcome.delta}</span>
              </div>
            )}

            {outcome && (
              <div className="score-outcome-label">{outcome.label}</div>
            )}

            {/* Bonuses */}
            {bonuses.totalBonus > 0 && (
              <div className="score-bonuses">
                <div className="score-bonuses-header">
                  BONUSES <span className="score-bonus-total">+{bonuses.totalBonus}</span>
                </div>

                {bonuses.sentimentShift && (
                  <div className="score-badge">
                    <span className="score-badge-icon">&#9829;</span>
                    <span className="score-badge-label">{bonuses.sentimentShift.label}</span>
                    <span className="score-badge-points">+{bonuses.sentimentShift.points}</span>
                  </div>
                )}

                {bonuses.easterEggs.map(egg => (
                  <div key={egg.id} className="score-badge score-badge-egg">
                    <span className="score-badge-icon">&#9733;</span>
                    <span className="score-badge-label">{egg.label}</span>
                    <span className="score-badge-points">+{egg.points}</span>
                  </div>
                ))}

                {bonuses.achievements.map(ach => (
                  <div key={ach.id} className="score-badge score-badge-achievement">
                    <span className="score-badge-icon">&#9670;</span>
                    <span className="score-badge-label">{ach.label}</span>
                    <span className="score-badge-points">+{ach.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* What You Missed */}
        {revealed >= 4 && scores.missed_facts && scores.missed_facts.length > 0 && (
          <div className="score-missed fade-in">
            <div className="score-missed-title">WHAT YOU MISSED:</div>
            {scores.missed_facts.map((fact, idx) => (
              <div key={idx} className="score-missed-fact">
                <span className="action-bullet">*</span> {fact}
              </div>
            ))}
          </div>
        )}

        {/* Reflection + CTA */}
        {revealed >= 5 && (
          <div className="score-cta fade-in">
            <div className="score-reflection">
              "What would you have done differently?"
            </div>

            <div className="score-renubu">
              <span className="score-renubu-tagline">Built by Renubu — the signals were there.</span>
              <br />
              <a href="https://calendly.com/justinstrackany" target="_blank" rel="noopener noreferrer">
                Talk to Justin about what you just experienced.
              </a>
            </div>

            <div className="score-footer">
              gtm.consulting/adventure
            </div>

            <div className="score-nav">
              <button className="score-button" onClick={onComplete}>
                Return to the cottage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
