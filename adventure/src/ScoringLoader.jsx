import React, { useState, useEffect } from 'react';

const flavorLines = [
  "Reading the room...",
  "Weighing what you uncovered...",
  "Measuring the silence between questions...",
  "Reviewing the signals...",
  "Tallying the cost of what you missed...",
];

export function ScoringLoader({ scenario }) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex(prev => (prev + 1) % flavorLines.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const characterName = scenario?.character?.name?.split(' ')[0] || 'The ghost';

  return (
    <div className="terminal scoring-loader">
      <div className="scoring-loader-inner">
        <div className="scoring-loader-character">{characterName} has left the room.</div>
        <div className="scoring-loader-text fade-in" key={lineIndex}>
          {flavorLines[lineIndex]}
        </div>
        <div className="scoring-loader-dots">
          <span className="scoring-dot"></span>
          <span className="scoring-dot"></span>
          <span className="scoring-dot"></span>
        </div>
      </div>
    </div>
  );
}
