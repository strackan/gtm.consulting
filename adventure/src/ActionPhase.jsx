import React, { useState, useRef, useEffect } from 'react';

export function ActionPhase({ scenario, factsDiscovered, onComplete }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Map discovered fact IDs to their display labels
  const discoveredLabels = scenario.facts
    .filter(f => factsDiscovered.includes(f.id))
    .map(f => f.label);

  const handleKeyDown = (e) => {
    if (confirmed) return;

    const num = parseInt(e.key);
    if (num >= 1 && num <= scenario.actions.length) {
      setSelectedAction(num - 1);
    }

    if (e.key === 'Enter' && selectedAction !== null) {
      setConfirmed(true);
      setTimeout(() => {
        onComplete(scenario.actions[selectedAction].id);
      }, 800);
    }
  };

  return (
    <div className="terminal action-phase" tabIndex={0} onKeyDown={handleKeyDown} ref={inputRef}>
      {/* Header */}
      <div className="action-header">
        <span className="action-title">DEBRIEF</span>
        <span className="action-scenario">{scenario.character.name} — {scenario.headline}</span>
      </div>

      <div className="output action-output">
        {/* What You Know */}
        <div className="action-section">
          <div className="action-section-title">WHAT YOU KNOW</div>
          {discoveredLabels.length > 0 ? (
            <div className="action-facts">
              {discoveredLabels.map((label, idx) => (
                <div key={idx} className="action-fact">
                  <span className="action-bullet">*</span> {label}
                </div>
              ))}
            </div>
          ) : (
            <div className="action-fact action-fact-empty">
              You didn't uncover much. Sometimes the hardest signals are the ones you don't hear.
            </div>
          )}
        </div>

        {/* Date Pressure */}
        <div className="action-section">
          <div className="action-pressure">{scenario.datePressure}</div>
        </div>

        {/* Actions */}
        <div className="action-section">
          <div className="action-section-title">WHAT DO YOU DO?</div>
          <div className="action-choices">
            {scenario.actions.map((action, idx) => (
              <div
                key={action.id}
                className={`action-choice ${selectedAction === idx ? 'selected' : ''} ${confirmed && selectedAction === idx ? 'confirmed' : ''}`}
                onClick={() => {
                  if (!confirmed) setSelectedAction(idx);
                }}
              >
                <span className="action-number">[{idx + 1}]</span>
                <span className="action-label">{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="action-prompt">
          {selectedAction !== null && !confirmed && (
            <span>Press ENTER to confirm: <strong>{scenario.actions[selectedAction].label}</strong></span>
          )}
          {selectedAction === null && (
            <span>Choose wisely. Type 1-{scenario.actions.length}.</span>
          )}
          {confirmed && (
            <span className="action-confirmed-text">Decision made.</span>
          )}
        </div>
      </div>
    </div>
  );
}
