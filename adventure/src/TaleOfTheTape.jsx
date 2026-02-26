import React, { useEffect, useRef } from 'react';

// DiceBear pixel-art avatar URLs — pinned per character
const avatarUrls = {
  chess: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=TommyFlores&hair=short01,short02&skinColor=d78b5e&mouth=sad01&eyes=variant01&clothing=variant01&clothingColor=2a4a2a&accessoriesProbability=0',
  dartboard: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=ReenaOkafor&hair=long19,long20&skinColor=9a6b4a&mouth=happy02&eyes=variant05&clothing=variant15&clothingColor=e84038&accessoriesProbability=0',
  puzzle: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=DeckMorrison&hair=short04,short05&skinColor=c9956b&mouth=sad08&eyes=variant04&clothing=variant04&clothingColor=1a1a1a&accessoriesProbability=0',
  cards: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=MaggieWhitfield&hair=short11&skinColor=e8c5a0&mouth=happy01&eyes=variant03&clothing=variant25&clothingColor=3a3a6a&glassesProbability=100',
};

// Difficulty tiers based on character complexity
const difficultyMap = {
  chess: 3,     // Tommy — guarded but direct, moderate
  dartboard: 2, // Reena — warm surface hides depth, easier to start
  puzzle: 4,    // Deck — cold start, technical gate, hardest
  cards: 4,     // Maggie — formal, layered, requires patience
};

function DifficultyBar({ level }) {
  const segments = [];
  for (let i = 0; i < 5; i++) {
    segments.push(
      <span key={i} className={`tape-diff-seg ${i < level ? 'tape-diff-filled' : 'tape-diff-empty'}`} />
    );
  }
  return <span className="tape-diff-bar">{segments}</span>;
}

export function TaleOfTheTape({ scenario, onReady }) {
  const containerRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onReady();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReady]);

  // Focus the container for accessibility
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const { character, headline, datePressure, totalFacts, id, arr, statedChurnReason } = scenario;
  const avatarUrl = avatarUrls[id] || avatarUrls.chess;
  const difficulty = difficultyMap[id] || 3;

  return (
    <div className="terminal tape-container" ref={containerRef} tabIndex={-1} onClick={onReady}>
      <div className="tape-card fade-in">
        <div className="tape-title">TALE OF THE TAPE</div>

        <div className="tape-divider"></div>

        <div className="tape-avatar-wrapper">
          <img
            src={avatarUrl}
            alt={character.name}
            className="tape-avatar"
            width="128"
            height="128"
          />
        </div>

        <div className="tape-name">{character.name.toUpperCase()}</div>
        <div className="tape-role">{character.title}</div>
        <div className="tape-company">{character.company}</div>

        <div className="tape-stats-divider"></div>

        <div className="tape-stats">
          <div className="tape-stat-row">
            <span className="tape-stat-label">Scenario</span>
            <span className="tape-stat-value">{headline}</span>
          </div>
          <div className="tape-stat-row">
            <span className="tape-stat-label">ARR</span>
            <span className="tape-stat-value tape-arr">{arr}</span>
          </div>
          <div className="tape-stat-row">
            <span className="tape-stat-label">Clock</span>
            <span className="tape-stat-value">{datePressure}</span>
          </div>
          <div className="tape-stat-row tape-stat-row-reason">
            <span className="tape-stat-label">Stated Reason</span>
            <span className="tape-stat-value tape-reason">{statedChurnReason}</span>
          </div>
          <div className="tape-stat-row">
            <span className="tape-stat-label">Signals</span>
            <span className="tape-stat-value">{totalFacts} hidden facts</span>
          </div>
          <div className="tape-stat-row">
            <span className="tape-stat-label">Difficulty</span>
            <span className="tape-stat-value"><DifficultyBar level={difficulty} /></span>
          </div>
        </div>

        <div className="tape-prompt">[ PRESS ENTER TO BEGIN ]</div>
      </div>
    </div>
  );
}
