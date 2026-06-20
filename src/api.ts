export interface ScoreEntry {
  score: number;
  won: number;
  played_at: string;
}

const base = '/api';

export async function signup(username: string, password: string): Promise<{ token: string; username: string }> {
  const res = await fetch(`${base}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup failed');
  return data;
}

export async function login(username: string, password: string): Promise<{ token: string; username: string }> {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function saveScore(token: string, score: number, won: boolean): Promise<void> {
  await fetch(`${base}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ score, won }),
  });
}

export async function getMyScores(token: string): Promise<ScoreEntry[]> {
  const res = await fetch(`${base}/scores/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}
