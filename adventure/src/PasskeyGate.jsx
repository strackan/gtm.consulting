import React, { useState, useRef, useEffect } from 'react';

export function PasskeyGate({ onPasskey, onGuest }) {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const slug = passkey.trim().toLowerCase();
    if (!slug) return;
    setError(null);
    setLoading(true);
    try {
      await onPasskey(slug);
    } catch {
      setError('Passkey not recognized. Check your link and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gate">
      <div className="gate-inner">
        <div className="gate-title">GTM.CONSULTANT</div>
        <div className="gate-subtitle">// adventure mode</div>

        <form className="gate-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="gate-input"
            type="text"
            value={passkey}
            onChange={(e) => { setPasskey(e.target.value); setError(null); }}
            placeholder="enter passkey"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="gate-submit" type="submit" disabled={loading || !passkey.trim()}>
            {loading ? 'Looking up...' : 'Enter'}
          </button>
        </form>

        {error && <div className="gate-error">{error}</div>}

        <button className="gate-guest" onClick={onGuest} disabled={loading}>
          Play as Guest
        </button>
      </div>
    </div>
  );
}
