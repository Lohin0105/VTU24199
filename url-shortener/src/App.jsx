import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, Navigate, Link } from 'react-router-dom';
import './App.css';

export default function App() {
  const [urls, setUrls] = useState(() => {
    const stored = localStorage.getItem('dark_urls');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('dark_urls', JSON.stringify(urls));
  }, [urls]);

  const shortenUrl = (original, minutes, custom) => {
    const code = custom || Math.random().toString(36).slice(2, 8);
    const expiry = new Date(Date.now() + minutes * 60000);
    const newEntry = {
      id: Date.now(),
      original,
      short: `${window.location.origin}/#/${code}`,
      code,
      expiry,
      clicks: 0,
    };
    setUrls(prev => [...prev, newEntry]);
    return newEntry;
  };

  const handleRedirect = (code) => {
    const data = JSON.parse(localStorage.getItem('dark_urls') || '[]');
    const match = data.find(u => u.code === code);
    if (!match) return null;

    match.clicks += 1;
    localStorage.setItem('dark_urls', JSON.stringify(data));
    return match.original;
  };

  return (
    <Router>
      <div className="layout">
        <aside>
          <h2>🚀 DarkShort</h2>
          <Link to="/">Shorten</Link>
          <Link to="/stats">Stats</Link>
        </aside>
        <main>
          <Routes>
            <Route path="/" element={<Shortener shortenUrl={shortenUrl} />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/:code" element={<Redirect handleRedirect={handleRedirect} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Shortener({ shortenUrl }) {
  const [url, setUrl] = useState('');
  const [custom, setCustom] = useState('');
  const [time, setTime] = useState(30);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const submit = e => {
    e.preventDefault();
    try {
      new URL(url);
      setErr('');
      const r = shortenUrl(url, time, custom);
      setResult(r);
    } catch {
      setErr('Invalid URL ❌');
    }
  };

  return (
    <div className="panel">
      <h3>Create Short Link</h3>
      <form onSubmit={submit}>
        <input placeholder="Paste a long URL..." value={url} onChange={e => setUrl(e.target.value)} />
        <input placeholder="Custom code (opt)" value={custom} onChange={e => setCustom(e.target.value)} />
        <input type="number" value={time} min="1" onChange={e => setTime(e.target.value)} />
        <button>Generate</button>
        {err && <p className="error">{err}</p>}
      </form>
      {result && (
        <div className="output">
          <span>Short URL:</span>
          <a href={result.short} target="_blank">{result.short}</a>
          <p>Valid until: {new Date(result.expiry).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

function Stats() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const stored = localStorage.getItem('dark_urls');
    if (stored) setList(JSON.parse(stored));
  }, []);
  return (
    <div className="panel">
      <h3>📊 Stats</h3>
      {list.length === 0 ? <p>No links yet.</p> : (
        <ul>
          {list.map(u => (
            <li key={u.id}>
              <a href={u.short} target="_blank">{u.short}</a> → {u.original}  
              <span> | Clicks: {u.clicks}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Redirect({ handleRedirect }) {
  const { code } = useParams();
  const destination = handleRedirect(code);
  if (destination) {
    window.location.href = destination;
    return <p className="redirecting">Redirecting...</p>;
  }
  return <Navigate to="/" />;
}
