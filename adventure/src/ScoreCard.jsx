import React, { useState, useEffect, useRef } from 'react';
import { getResultLabel } from './scenarios';

export function ScoreCard({ scenario, sessionData, onComplete }) {
  const [revealed, setRevealed] = useState(0); // animation state: 0=nothing, 1=result, 2=scores, 3=missed, 4=cta
  const [animatedScores, setAnimatedScores] = useState({ discovery: 0, action: 0, efficiency: 0, total: 0 });
  const outputRef = useRef(null);

  const scores = sessionData.scores || {
    score_discovery: 0,
    score_action: 0,
    score_efficiency: 0,
    score_total: 0,
    missed_facts: [],
  };

  // Progressive reveal animation
  useEffect(() => {
    const timers = [
      setTimeout(() => setRevealed(1), 500),
      setTimeout(() => setRevealed(2), 1500),
      setTimeout(() => setRevealed(3), 3000),
      setTimeout(() => setRevealed(4), 4500),
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

  const resultLabel = getResultLabel(scores.score_total);

  function renderBar(value, max) {
    const width = 30;
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
  }

  const actionLabel = scenario.actions.find(a => a.id === sessionData.actionChosen)?.label || sessionData.actionChosen;

  return (
    <div className="terminal score-card">
      <div className="score-header">
        <span className="score-title">RESULTS</span>
        <span className="score-scenario">{scenario.character.name} — {scenario.headline}</span>
      </div>

      <div className="output score-output" ref={outputRef}>
        {/* Result Label */}
        {revealed >= 1 && (
          <div className="score-result fade-in">
            <div className="score-result-label">{resultLabel}</div>
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
            <div className="score-row score-total-row">
              <span className="score-category">TOTAL</span>
              <span className="score-bar"></span>
              <span className="score-value score-total-value">{animatedScores.total}/100</span>
            </div>

            <div className="score-action-taken">
              <span className="score-action-label">Your move:</span> {actionLabel}
            </div>
          </div>
        )}

        {/* What You Missed */}
        {revealed >= 3 && scores.missed_facts && scores.missed_facts.length > 0 && (
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
        {revealed >= 4 && (
          <div className="score-cta fade-in">
            <div className="score-reflection">
              "If you had known, what would you have done differently?"
            </div>

            <div className="score-renubu">
              Renubu catches these signals before the clock runs out.
              <br />
              <a href="https://calendly.com/justinstrackany" target="_blank" rel="noopener noreferrer">
                Talk to Justin about what you just experienced.
              </a>
            </div>

            <div className="score-nav">
              <button className="score-button" onClick={onComplete}>
                Return to the game room
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
