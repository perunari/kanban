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

// Tasks API
app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, m.name AS member_name
    FROM tasks t
    LEFT JOIN members m ON t.member_id = m.id
    ORDER BY t.column_id ASC, t.position ASC
  `).all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description = '', column_id, member_id = null, priority = 'medium', due_date = null } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!column_id || !Number.isInteger(Number(column_id))) {
    return res.status(400).json({ error: 'column_id is required and must be an integer' });
  }
  const validPriorities = ['urgent', 'high', 'medium', 'low'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'priority must be one of: urgent, high, medium, low' });
  }

  const column = db.prepare('SELECT id FROM columns WHERE id = ?').get(Number(column_id));
  if (!column) {
    return res.status(404).json({ error: 'Column not found' });
  }
  if (member_id !== null) {
    const member = db.prepare('SELECT id FROM members WHERE id = ?').get(Number(member_id));
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
  }

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS maxPos FROM tasks WHERE column_id = ?').get(Number(column_id)).maxPos;
  const result = db.prepare(`
    INSERT INTO tasks (title, description, column_id, member_id, priority, due_date, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title.trim(), description, Number(column_id), member_id ? Number(member_id) : null, priority, due_date, maxPos + 1);

  const task = db.prepare(`
    SELECT t.*, m.name AS member_name
    FROM tasks t
    LEFT JOIN members m ON t.member_id = m.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, member_id, priority, due_date } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }
  const validPriorities = ['urgent', 'high', 'medium', 'low'];
  if (priority !== undefined && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'priority must be one of: urgent, high, medium, low' });
  }
  if (member_id !== undefined && member_id !== null) {
    const member = db.prepare('SELECT id FROM members WHERE id = ?').get(Number(member_id));
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
  }

  const newTitle = title !== undefined ? title.trim() : task.title;
  const newDesc = description !== undefined ? description : task.description;
  const newMemberId = member_id !== undefined ? (member_id ? Number(member_id) : null) : task.member_id;
  const newPriority = priority !== undefined ? priority : task.priority;
  const newDueDate = due_date !== undefined ? due_date : task.due_date;

  db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, member_id = ?, priority = ?, due_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newTitle, newDesc, newMemberId, newPriority, newDueDate, id);

  const updated = db.prepare(`
    SELECT t.*, m.name AS member_name
    FROM tasks t
    LEFT JOIN members m ON t.member_id = m.id
    WHERE t.id = ?
  `).get(id);
  res.json(updated);
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.status(204).end();
});

// PUT /api/tasks/:id/move — 列間移動 body: { column_id, position }
app.put('/api/tasks/:id/move', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { column_id, position } = req.body;
  if (column_id === undefined || !Number.isInteger(Number(column_id))) {
    return res.status(400).json({ error: 'column_id is required and must be an integer' });
  }
  if (position === undefined || !Number.isInteger(Number(position)) || Number(position) < 0) {
    return res.status(400).json({ error: 'position is required and must be a non-negative integer' });
  }

  const newColumnId = Number(column_id);
  const newPosition = Number(position);

  const column = db.prepare('SELECT id FROM columns WHERE id = ?').get(newColumnId);
  if (!column) {
    return res.status(404).json({ error: 'Column not found' });
  }

  const moveTask = db.transaction(() => {
    const oldColumnId = task.column_id;
    const oldPosition = task.position;

    if (oldColumnId === newColumnId) {
      // 同一列内での並び替え
      if (oldPosition < newPosition) {
        db.prepare(`
          UPDATE tasks SET position = position - 1
          WHERE column_id = ? AND position > ? AND position <= ? AND id != ?
        `).run(oldColumnId, oldPosition, newPosition, id);
      } else if (oldPosition > newPosition) {
        db.prepare(`
          UPDATE tasks SET position = position + 1
          WHERE column_id = ? AND position >= ? AND position < ? AND id != ?
        `).run(oldColumnId, newPosition, oldPosition, id);
      }
    } else {
      // 別列への移動: 元の列で詰める
      db.prepare(`
        UPDATE tasks SET position = position - 1
        WHERE column_id = ? AND position > ?
      `).run(oldColumnId, oldPosition);
      // 移動先列で隙間を空ける
      db.prepare(`
        UPDATE tasks SET position = position + 1
        WHERE column_id = ? AND position >= ?
      `).run(newColumnId, newPosition);
    }

    db.prepare(`
      UPDATE tasks SET column_id = ?, position = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newColumnId, newPosition, id);
  });

  moveTask();

  const updated = db.prepare(`
    SELECT t.*, m.name AS member_name
    FROM tasks t
    LEFT JOIN members m ON t.member_id = m.id
    WHERE t.id = ?
  `).get(id);
  res.json(updated);
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;
