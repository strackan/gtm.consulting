import React, { useState, useEffect, useRef } from 'react';

export function Terminal({ gameEngine, onGhostTrigger }) {
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const outputRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize game
  useEffect(() => {
    const intro = gameEngine.getIntro();
    setOutput([{ type: 'text', content: intro }]);
    setGameState(gameEngine.getState());
  }, [gameEngine]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on click anywhere
  useEffect(() => {
    const handleClick = () => {
      inputRef.current?.focus();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Add command to output
    setOutput(prev => [...prev, { type: 'command', content: trimmedInput }]);

    // Add to history
    setCommandHistory(prev => [...prev, trimmedInput]);
    setHistoryIndex(-1);

    // Execute command
    const result = gameEngine.execute(trimmedInput);

    // Check if the result is a ghost trigger signal
    if (result && typeof result === 'object' && result.type === 'ghost_trigger') {
      // Show transition message
      if (result.message) {
        setOutput(prev => [...prev, { type: 'text', content: result.message }]);
      }
      setOutput(prev => [...prev, { type: 'text', content: '\nThe room dims. A figure materializes across from you...\n' }]);

      // Trigger ghost mode after a brief delay
      setTimeout(() => {
        onGhostTrigger(result.scenarioId);
      }, 1500);

      setInput('');
      setGameState(gameEngine.getState());
      return;
    }

    // Add result to output
    if (result) {
      setOutput(prev => [...prev, { type: 'text', content: result }]);
    }

    // Update game state
    setGameState(gameEngine.getState());

    // Clear input
    setInput('');
  };

  const handleKeyDown = (e) => {
    // Command history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1
          ? historyIndex + 1
          : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="terminal">
      {/* Status Bar */}
      <div className="status-bar">
        <span className="location">{gameState?.location || 'Loading...'}</span>
        <div className="stats">
          <span>Score: {gameState?.score || 0}</span>
          <span>Moves: {gameState?.moves || 0}</span>
        </div>
      </div>

      {/* Output Area */}
      <div className="output" ref={outputRef}>
        {output.map((line, idx) => (
          <div key={idx} className={`output-line ${line.type}`}>
            {line.content}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form className="input-area" onSubmit={handleSubmit}>
        <span className="input-prompt">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          className="input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </form>
    </div>
  );
}
