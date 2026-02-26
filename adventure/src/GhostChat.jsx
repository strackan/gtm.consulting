import React, { useState, useEffect, useRef, useCallback } from 'react';
import { streamGhostChat, extractMetadata } from './api';

export function GhostChat({ scenario, visitorProfile, onComplete, maxQuestionsPerSession = 5 }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [questionCount, setQuestionCount] = useState(0);
  const [factsDiscovered, setFactsDiscovered] = useState([]);
  const [isEnding, setIsEnding] = useState(false);
  const [flickering, setFlickering] = useState(false);
  const [maxRapport, setMaxRapport] = useState(2); // Track highest rapport achieved

  const outputRef = useRef(null);
  const inputRef = useRef(null);

  const maxQuestions = maxQuestionsPerSession;

  // Show intro message on mount
  useEffect(() => {
    if (scenario.introMessage) {
      setMessages([{ role: 'assistant', content: scenario.introMessage }]);
    }
  }, [scenario]);

  // Chess clock timer — only runs while it's the player's turn
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0 || isEnding) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, isEnding]);

  // End game when timer hits 0 or max questions reached
  useEffect(() => {
    if ((timeLeft <= 0 || questionCount >= maxQuestions) && !isEnding && !isWaiting) {
      endConversation();
    }
  }, [timeLeft, questionCount, isEnding, isWaiting]);

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input
  useEffect(() => {
    const handleClick = () => inputRef.current?.focus();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const endConversation = useCallback((earlyExit = false) => {
    setIsEnding(true);
    setIsTimerRunning(false);
    setFlickering(true);

    setTimeout(() => {
      setFlickering(false);
      // Build transcript for scoring
      const transcript = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      onComplete(transcript, factsDiscovered, maxRapport);
    }, earlyExit ? 800 : 1500);
  }, [messages, factsDiscovered, maxRapport, onComplete]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isWaiting || isEnding) return;

    // Check for special commands
    const upperInput = trimmedInput.toUpperCase();

    // TALE — restate the dossier
    if (['TALE', 'DOSSIER', 'TAPE', 'STATS', 'CARD', 'INTRO'].includes(upperInput)) {
      setInput('');
      const { character, headline, datePressure, arr, statedChurnReason, totalFacts } = scenario;
      setMessages(prev => [...prev, {
        role: 'system',
        content: `── TALE OF THE TAPE ──\n${character.name} · ${character.title}\n${character.company} · ${arr}\n\nScenario: ${headline}\nDeadline: ${datePressure}\nStated Reason: ${statedChurnReason}\nSignals: ${totalFacts} hidden facts`
      }]);
      return;
    }

    // LEAVE — early exit
    if (upperInput === 'LEAVE' || upperInput === 'DONE' || upperInput === 'EXIT') {
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: trimmedInput }]);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `*${scenario.character.name.split(' ')[0]} watches you stand up. A flicker of something — disappointment? Relief? — crosses their face before it fades.*`
      }]);
      setTimeout(() => endConversation(true), 800);
      return;
    }

    // Add user message
    const userMsg = { role: 'user', content: trimmedInput };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsWaiting(true);
    setIsTimerRunning(false); // Pause player's clock during AI response

    // Build messages for API (exclude intro, only user/assistant pairs)
    const apiMessages = [...messages, userMsg]
      .filter((m, i) => i > 0 || m.role === 'user') // skip intro for API
      .map(m => ({ role: m.role, content: m.content }));

    // Assemble system prompt with visitor context
    let systemPrompt = scenario.systemPrompt;
    if (visitorProfile) {
      systemPrompt += `\n\n# VISITOR CONTEXT\nYou are speaking with ${visitorProfile.name}${visitorProfile.company ? ` from ${visitorProfile.company}` : ''}${visitorProfile.role ? `, who is a ${visitorProfile.role}` : ''}. ${visitorProfile.context || ''}`;
    }

    // Add placeholder assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    let fullResponse = '';

    try {
      const stream = await streamGhostChat(scenario.id, systemPrompt, apiMessages, visitorProfile);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Update last message, stripping metadata for display
        const { text } = extractMetadata(fullResponse);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: text, streaming: true };
          return updated;
        });
      }

      // Final update with streaming complete
      const { text, metadata } = extractMetadata(fullResponse);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: text };
        return updated;
      });

      // Track discovered facts
      if (metadata && metadata.facts_revealed && metadata.facts_revealed.length > 0) {
        setFactsDiscovered(prev => {
          const combined = new Set([...prev, ...metadata.facts_revealed]);
          return [...combined];
        });
      }

      // Track max rapport
      if (metadata && typeof metadata.rapport_level === 'number') {
        setMaxRapport(prev => Math.max(prev, metadata.rapport_level));
      }
    } catch (err) {
      // On error, show a fallback message
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '*static crackles* ...the connection wavers. Try again.',
        };
        return updated;
      });
    }

    setIsWaiting(false);
    setQuestionCount(prev => prev + 1);
    setIsTimerRunning(true); // Resume player's clock
  };

  const questionsRemaining = maxQuestions - questionCount;
  const timerWarning = timeLeft <= 60;
  const timerCritical = timeLeft <= 30;

  return (
    <div className={`terminal ghost-chat ${flickering ? 'flicker' : ''}`}>
      {/* Ghost Header */}
      <div className="ghost-header">
        <div className="ghost-character">
          <span className="ghost-name">{scenario.character.name}</span>
          <span className="ghost-title">{scenario.character.title}, {scenario.character.company}</span>
        </div>
        <div className="ghost-controls">
          <div className={`ghost-timer ${timerWarning ? 'warning' : ''} ${timerCritical ? 'critical' : ''}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="ghost-questions">
            Q {questionCount}/{maxQuestions}
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="ghost-timer-bar">
        <div
          className="ghost-timer-fill"
          style={{ width: `${(timeLeft / 300) * 100}%` }}
        />
      </div>

      {/* Chat Output */}
      <div className="output ghost-output" ref={outputRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`ghost-message ${msg.role}`}>
            {msg.role === 'user' && <span className="ghost-label">You:</span>}
            {msg.role === 'assistant' && idx > 0 && <span className="ghost-label">{scenario.character.name.split(' ')[0]}:</span>}
            <span className="ghost-text">{msg.content}</span>
            {msg.streaming && <span className="ghost-cursor">|</span>}
          </div>
        ))}
        {isWaiting && messages[messages.length - 1]?.content === '' && (
          <div className="ghost-thinking">
            <span className="ghost-label">{scenario.character.name.split(' ')[0]}:</span>
            <span className="ghost-dots">...</span>
          </div>
        )}
        {isEnding && (
          <div className="ghost-ending">
            Time's up. You're pulled back.
          </div>
        )}
      </div>

      {/* Fact Progress */}
      <div className="ghost-progress">
        <span className="ghost-progress-label">
          Signals uncovered: {factsDiscovered.length} of ~{scenario.totalFacts}
        </span>
        <div className="ghost-progress-bar">
          <div
            className="ghost-progress-fill"
            style={{ width: `${Math.min((factsDiscovered.length / scenario.totalFacts) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Input */}
      {!isEnding && (
        <form className="input-area" onSubmit={handleSubmit}>
          <span className="input-prompt">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isWaiting ? 'waiting...' : `${questionsRemaining} questions remain — TALE for dossier, LEAVE to exit`}
            disabled={isWaiting}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </form>
      )}
    </div>
  );
}
