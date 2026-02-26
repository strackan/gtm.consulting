import React, { useState, useEffect } from 'react';
import { fetchLeaderboard } from './api';
import { MAX_POSSIBLE_SCORE } from './scenarios';

export function Leaderboard({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then(data => {
      setEntries(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="terminal leaderboard">
      <div className="leaderboard-header">
        <span className="leaderboard-title">LEADERBOARD</span>
        <span className="leaderboard-max">Max possible: {MAX_POSSIBLE_SCORE}</span>
      </div>

      <div className="output leaderboard-output">
        {loading && (
          <div className="leaderboard-loading">Loading scores...</div>
        )}

        {!loading && entries.length === 0 && (
          <div className="leaderboard-empty">
            No scores yet. Be the first on the board.
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="leaderboard-table">
            <div className="leaderboard-row leaderboard-row-header">
              <span className="leaderboard-col-rank">#</span>
              <span className="leaderboard-col-name">Player</span>
              <span className="leaderboard-col-scenarios">Played</span>
              <span className="leaderboard-col-score">Score</span>
            </div>
            {entries.map((entry, idx) => (
              <div key={idx} className={`leaderboard-row ${idx < 3 ? 'leaderboard-top3' : ''}`}>
                <span className="leaderboard-col-rank">{idx + 1}</span>
                <span className="leaderboard-col-name">
                  {entry.name}
                  {entry.company && <span className="leaderboard-company"> — {entry.company}</span>}
                </span>
                <span className="leaderboard-col-scenarios">{entry.scenarios_played}/4</span>
                <span className="leaderboard-col-score">{entry.total_score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="leaderboard-nav">
        <button className="score-button" onClick={onBack}>
          Return to the cottage
        </button>
      </div>
    </div>
  );
}
