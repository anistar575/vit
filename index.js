require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const VTopClient = require('./vtopClient');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true if using HTTPS
}));

// Utility: Get client by session
function getClient(req) {
  const sid = req.sessionID;
  return global._VTOP_SESSIONS && global._VTOP_SESSIONS[sid];
}

// ---- Login ----
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Missing credentials' });

  try {
    const client = new VTopClient();
    await client.init();

    const ok = await client.login(username, password);
    if (!ok) {
      await client.close();
      return res.status(401).json({ error: 'Login failed. Check credentials.' });
    }

    req.session.vtop = { loggedIn: true };

    if (!global._VTOP_SESSIONS) global._VTOP_SESSIONS = {};
    global._VTOP_SESSIONS[req.sessionID] = client;

    res.json({ message: 'Logged in' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ---- Logout ----
app.post('/api/logout', async (req, res) => {
  const client = getClient(req);
  if (client) await client.close();

  if (global._VTOP_SESSIONS) delete global._VTOP_SESSIONS[req.sessionID];
  req.session.destroy(err => {
    if (err) console.error('Session destroy error', err);
  });

  res.json({ message: 'Logged out' });
});

// ---- Schedule ----
app.get('/api/schedule', async (req, res) => {
  const client = getClient(req);
  if (!client) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const schedule = await client.getSchedule();
    res.json({ schedule });
  } catch (err) {
    console.error('Schedule error:', err.message);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// ---- Attendance ----
app.get('/api/attendance', async (req, res) => {
  const client = getClient(req);
  if (!client) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const attendance = await client.getAttendance();
    res.json({ attendance });
  } catch (err) {
    console.error('Attendance error:', err.message);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// ---- Marks ----
app.get('/api/marks', async (req, res) => {
  const client = getClient(req);
  if (!client) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const marks = await client.getMarks();
    res.json({ marks });
  } catch (err) {
    console.error('Marks error:', err.message);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
});

// ---- Start Server ----
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));

