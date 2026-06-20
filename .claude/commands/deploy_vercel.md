Deploy this project to Vercel. The project is a Vite + React frontend with an Express + SQLite backend. Follow every step below in order.

## Step 1 — Check Vercel CLI

Run `vercel --version`.
- If missing, run `npm install -g vercel` and confirm it installs.
- If present, continue.

## Step 2 — Check login

Run `vercel whoami`.
- If not logged in, tell the user: "Please run `! vercel login` in the prompt to authenticate, then re-run `/deploy_vercel`." Stop here until they confirm they are logged in.
- If logged in, continue.

## Step 3 — Explain the SQLite limitation and confirm

Tell the user:

> ⚠️ **SQLite on Vercel**: Vercel serverless functions have an ephemeral (read-only after build) filesystem. The `game.db` file will be bundled at deploy time, so existing users can log in, but **new sign-ups and score saves will fail** — writes don't persist across requests. For a production app you would swap SQLite for a cloud database (e.g. Vercel Postgres, PlanetScale, Turso). For a demo/portfolio deploy this is fine.

Ask the user if they want to proceed. If yes, continue.

## Step 4 — Create `vercel.json`

Create or overwrite `/vercel.json` in the project root with this content:

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "build",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" }
  ]
}
```

This tells Vercel to build the frontend with Vite, serve the output from `build/`, and forward all `/api/*` requests to a single serverless function.

## Step 5 — Create the Vercel serverless function

Create `/api/index.js` that exports the Express app so Vercel can run it as a serverless function. It is essentially the same as `server.cjs` but:
- Uses a **relative path** to `game.db` anchored to `__dirname` (already done in `server.cjs`)
- Exports the `app` instead of calling `app.listen`

Write the file as:

```js
const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const JWT_SECRET = 'treasure-game-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// Vercel bundles the db file at deploy time; writes won't persist between invocations.
const db = new Database(path.join(__dirname, '..', 'game.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL,
    won INTEGER NOT NULL,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Username already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid username or password' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

app.post('/api/scores', authenticate, (req, res) => {
  const { score, won } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'score required' });
  db.prepare('INSERT INTO game_scores (user_id, score, won) VALUES (?, ?, ?)').run(req.userId, score, won ? 1 : 0);
  res.json({ success: true });
});

app.get('/api/scores/me', authenticate, (req, res) => {
  const scores = db.prepare(
    'SELECT score, won, played_at FROM game_scores WHERE user_id = ? ORDER BY played_at DESC LIMIT 10'
  ).all(req.userId);
  res.json(scores);
});

module.exports = app;
```

## Step 6 — Deploy

Run:

```bash
vercel --prod
```

When prompted:
- **Set up and deploy** → Yes
- **Which scope** → select the user's personal account
- **Link to existing project?** → No (unless they've deployed before)
- **Project name** → accept default or let user choose
- **Directory** → `.` (current directory)
- Vercel will auto-detect Vite; confirm the settings match `vercel.json`

## Step 7 — Report

After the deploy succeeds, show the user:
- The production URL (e.g. `https://your-project.vercel.app`)
- Remind them that guest mode works fully; sign-in works for existing users in the bundled `game.db`; new sign-ups will not persist between cold starts on the free tier
- Suggest running `vercel env add JWT_SECRET` to move the secret out of the source code if they plan to share the repo publicly
