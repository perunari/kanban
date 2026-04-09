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

// Columns API
app.get('/api/columns', (req, res) => {
  const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all();
  res.json(columns);
});

app.post('/api/columns', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }
  const trimmed = name.trim();
  const existing = db.prepare('SELECT id FROM columns WHERE name = ?').get(trimmed);
  if (existing) {
    return res.status(409).json({ error: 'Column name already exists' });
  }
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS maxPos FROM columns').get().maxPos;
  const result = db.prepare('INSERT INTO columns (name, position) VALUES (?, ?)').run(trimmed, maxPos + 1);
  const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(column);
});

app.delete('/api/columns/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const column = db.prepare('SELECT id FROM columns WHERE id = ?').get(id);
  if (!column) {
    return res.status(404).json({ error: 'Column not found' });
  }
  db.prepare('DELETE FROM columns WHERE id = ?').run(id);
  res.status(204).end();
});

// PUT /api/columns/reorder — body: { order: [id, id, ...] }
app.put('/api/columns/reorder', (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: 'order must be a non-empty array of column ids' });
  }
  if (!order.every(id => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({ error: 'All ids in order must be positive integers' });
  }
  const updatePos = db.prepare('UPDATE columns SET position = ? WHERE id = ?');
  const reorder = db.transaction((ids) => {
    ids.forEach((id, index) => updatePos.run(index, id));
  });
  reorder(order);
  const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all();
  res.json(columns);
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;
