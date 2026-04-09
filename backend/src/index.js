const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Members API
app.get('/api/members', (req, res) => {
  const members = db.prepare('SELECT * FROM members ORDER BY created_at ASC').all();
  res.json(members);
});

app.post('/api/members', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }
  const trimmed = name.trim();
  const existing = db.prepare('SELECT id FROM members WHERE name = ?').get(trimmed);
  if (existing) {
    return res.status(409).json({ error: 'Member name already exists' });
  }
  const result = db.prepare('INSERT INTO members (name) VALUES (?)').run(trimmed);
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(member);
});

app.delete('/api/members/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const member = db.prepare('SELECT id FROM members WHERE id = ?').get(id);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  db.prepare('DELETE FROM members WHERE id = ?').run(id);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;
