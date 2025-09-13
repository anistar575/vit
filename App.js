import React, { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState({ schedule: [], attendance: [], marks: [] });
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- Login ----
  async function login() {
    setLoading(true);
    setError('');

    try {
      const resp = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const js = await resp.json();
      if (!resp.ok) {
        setError(js.error || 'Login failed');
        setLoading(false);
        return;
      }

      setLoggedIn(true);
      await fetchAll();
    } catch (err) {
      setError('Server error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- Fetch all data ----
  async function fetchAll() {
    setLoading(true);
    const endpoints = ['schedule', 'attendance', 'marks'];
    const out = {};

    try {
      for (const e of endpoints) {
        const r = await fetch(`http://localhost:4000/api/${e}`, { credentials: 'include' });
        const j = await r.json();
        out[e] = j[e] || [];
      }
      setData(out);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- Login form ----
  if (!loggedIn) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>VTOP Connector</h1>
        <div style={styles.card}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
          />
          <button onClick={login} style={styles.button} disabled={loading}>
            {loading ? 'Logging in...' : 'Login & Fetch'}
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </div>
      </div>
    );
  }

  // ---- Dashboard ----
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Welcome, {username}</h1>
      {loading && <p>Loading data...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {/* Schedule */}
      <h2>📅 Class Schedule</h2>
      <Table data={data.schedule} columns={['day', 'time', 'subject', 'venue']} />

      {/* Attendance */}
      <h2>✅ Attendance</h2>
      <Table data={data.attendance} columns={['subject', 'attended', 'total', 'percent']} />

      {/* Marks */}
      <h2>📊 Marks</h2>
      <Table data={data.marks} columns={['subject', 'test', 'marks']} />
    </div>
  );
}

// ---- Table Component ----
function Table({ data, columns }) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center' }}>
              No data
            </td>
          </tr>
        )}
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(col => (
              <td key={col}>{row[col]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f4f4f9' },
  title: { fontSize: '2rem', marginBottom: 20 },
  card: { display: 'flex', flexDirection: 'column', background: '#fff', padding: 20, borderRadius: 10, boxShadow: '0 4px 8px rgba(0,0,0,0.1)', width: 300 },
  input: { padding: 10, margin: '8px 0', border: '1px solid #ccc', borderRadius: 5 },
  button: { padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', marginTop: 10 },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: 20 },
  error: { color: 'red', marginTop: 10 }
};

export default App;

