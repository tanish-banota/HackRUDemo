import { useEffect, useMemo, useRef, useState } from 'react';

const defaultApiUrl = import.meta.env.PROD ? 'https://time-until-api.onrender.com' : 'http://localhost:4000';
const API_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, '');
const DEFAULT_ACCENT = '#e85d3f';

function getCountdownId() {
  const match = window.location.pathname.match(/^\/c\/([A-Za-z0-9]{8})$/);
  return match?.[1] || null;
}

function formatTargetForInput(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(targetDate).getTime() - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(targetDate).getTime() - Date.now()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [targetDate]);

  return {
    complete: remaining === 0,
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60)
  };
}

function CelebrationExperience({ accent }) {
  const audioRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftImageVisible, setGiftImageVisible] = useState(false);

  async function toggleSound() {
    if (!audioRef.current) return;
    if (started) {
      audioRef.current.pause();
      setStarted(false);
      return;
    }

    try {
      await audioRef.current.play();
      setStarted(true);
    } catch {
      setStarted(false);
    }
  }

  return (
    <section className="celebration-experience" style={{ '--accent': accent || DEFAULT_ACCENT }} aria-label="Celebration controls">
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <div className="spark-field" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--spark': index }} />)}</div>
      <audio ref={audioRef} loop preload="auto" src="/audio/celebration.mp3" />
      <div className="celebration-controls">
        <button className={`sound-button${started ? ' is-playing' : ''}`} type="button" onClick={toggleSound} aria-pressed={started}>
          <span className="sound-icon" aria-hidden="true">{started ? 'Ⅱ' : '▶'}</span>
          {started ? 'Music on' : 'Start the celebration'}
        </button>
      </div>
      <button className={`gift${giftOpen ? ' is-open' : ''}`} type="button" onClick={() => setGiftOpen((open) => !open)} aria-expanded={giftOpen} aria-label={giftOpen ? 'Close your surprise' : 'Open your surprise'}>
        <span className="gift-lid"><i /></span>
        <span className="gift-box"><i /></span>
        <span className="gift-bow" aria-hidden="true"><i /><i /></span>
        <span className="gift-label">{giftOpen ? 'Close' : 'Open me'}</span>
      </button>
      <div className={`gift-reveal${giftOpen ? ' is-visible' : ''}`} aria-hidden={!giftOpen}>
        <span className="reveal-kicker">A little something</span>
        <strong>You made it<br />to this moment.</strong>
        <img className={`gift-image${giftImageVisible ? ' is-visible' : ''}`} src="/gifts/image.png" alt="" onLoad={() => setGiftImageVisible(true)} onError={() => setGiftImageVisible(false)} />
        <span className="reveal-sparkle" aria-hidden="true">✦</span>
      </div>
    </section>
  );
}

function CountdownClock({ targetDate, accent }) {
  const time = useCountdown(targetDate);
  const confetti = Array.from({ length: 28 }, (_, index) => index);
  const values = [
    ['days', time.days],
    ['hours', time.hours],
    ['minutes', time.minutes],
    ['seconds', time.seconds]
  ];

  return (
    <div className={`clock${time.complete ? ' is-complete' : ''}`} style={{ '--accent': accent || DEFAULT_ACCENT }}>
      <div className="clock-status">{time.complete ? 'The moment is here' : 'Counting down live'}</div>
      {time.complete && <div className="celebration" aria-hidden="true">{confetti.map((piece) => <i key={piece} style={{ '--piece': piece }} />)}</div>}
      <div className="clock-grid">
        {time.complete ? (
          <div className="now-reveal"><strong>NOW</strong><span>It is time</span></div>
        ) : values.map(([label, value]) => (
          <div className="clock-unit" key={label}>
            <strong>{String(value).padStart(2, '0')}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {time.complete && <CelebrationExperience accent={accent} />}
    </div>
  );
}

function Header({ theme, onToggleTheme }) {
  return (
    <header className="site-header">
      <a className="wordmark" href="/">TIME <span>UNTIL</span></a>
      <div className="header-tools">
        <span className="header-note">A small clock for big moments</span>
        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  );
}

function CreatePage({ theme, onToggleTheme }) {
  const initialDate = useMemo(() => formatTargetForInput(new Date(Date.now() + 7 * 86_400_000)), []);
  const [form, setForm] = useState({ title: '', targetDate: initialDate, themeAccent: DEFAULT_ACCENT });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/countdowns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          targetDate: new Date(form.targetDate).toISOString(),
          themeAccent: form.themeAccent
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create countdown.');
      window.location.assign(`/c/${data.countdown.id}`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main className="landing-shell">
        <section className="intro-panel">
          <p className="eyebrow">Make the wait visible</p>
          <h1>What are you counting down to?</h1>
          <p className="intro-copy">Create a beautiful, shareable timer for the deadline, launch, trip, or tiny personal milestone that matters next.</p>
          <div className="signal-line"><span /> Your timer will have its own private link</div>
        </section>

        <section className="form-panel">
          <form onSubmit={handleSubmit}>
            <label htmlFor="title">Event title <span>Required</span></label>
            <input id="title" name="title" value={form.title} onChange={updateField} placeholder="HackRU submission" required maxLength={255} />

            <label htmlFor="targetDate">Target date and time <span>Required</span></label>
            <input id="targetDate" name="targetDate" type="datetime-local" value={form.targetDate} onChange={updateField} required />

            <div className="accent-label-row">
              <label htmlFor="themeAccent">Theme accent <span>Optional</span></label>
              <input className="color-picker" id="themeAccent" name="themeAccent" type="color" value={form.themeAccent} onChange={updateField} aria-label="Choose theme accent" />
            </div>
            <p className="field-help">Pick a color that feels like the moment.</p>

            {error && <p className="error-message" role="alert">{error}</p>}
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Creating timer...' : 'Create my countdown'} <span aria-hidden="true">↗</span></button>
          </form>
          <p className="form-footnote">No account. No clutter. Just a link you can share.</p>
        </section>
      </main>
      <footer className="site-footer"><span>Built as a deployment teaching template</span><span>React / Express / PostgreSQL</span></footer>
    </>
  );
}

function SharePage({ id, theme, onToggleTheme }) {
  const [countdown, setCountdown] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/countdowns/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Countdown not found.');
        setCountdown(data.countdown);
      })
      .catch((fetchError) => setError(fetchError.message));
  }, [id]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (error) {
    return <><Header theme={theme} onToggleTheme={onToggleTheme} /><main className="message-page"><p className="eyebrow">404 / Not found</p><h1>This countdown has slipped away.</h1><p>{error}</p><a className="text-link" href="/">Create a new one <span>↗</span></a></main></>;
  }
  if (!countdown) return <><Header theme={theme} onToggleTheme={onToggleTheme} /><main className="message-page"><div className="loading-mark" /><p className="eyebrow">Loading your moment</p></main></>;

  return (
    <>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main className="share-shell" style={{ '--accent': countdown.themeAccent || DEFAULT_ACCENT }}>
        <div className="share-meta"><span className="live-dot" /> Live countdown <span className="slash">/</span> {new Date(countdown.targetDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
        <h1>{countdown.title}</h1>
        <CountdownClock targetDate={countdown.targetDate} accent={countdown.themeAccent} />
        <div className="share-actions"><button className="secondary-button" onClick={copyLink}>{copied ? 'Link copied' : 'Copy share link'} <span aria-hidden="true">↗</span></button><a className="text-link" href="/">Create your own</a></div>
      </main>
      <footer className="site-footer"><span>Share this moment</span><span>{window.location.origin}/c/{id}</span></footer>
    </>
  );
}

export default function App() {
  const id = getCountdownId();
  const [theme, setTheme] = useState(() => window.localStorage.getItem('time-until-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('time-until-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light');
  }

  return id
    ? <SharePage id={id} theme={theme} onToggleTheme={toggleTheme} />
    : <CreatePage theme={theme} onToggleTheme={toggleTheme} />;
}
