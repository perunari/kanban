const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Members
export const getMembers = () => request('/api/members');

export const createMember = (name) =>
  request('/api/members', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const deleteMember = (id) =>
  request(`/api/members/${id}`, { method: 'DELETE' });

// Columns
export const getColumns = () => request('/api/columns');

export const createColumn = (name) =>
  request('/api/columns', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const deleteColumn = (id) =>
  request(`/api/columns/${id}`, { method: 'DELETE' });

export const reorderColumns = (order) =>
  request('/api/columns/reorder', {
    method: 'PUT',
    body: JSON.stringify({ order }),
  });

// Tasks
export const getTasks = () => request('/api/tasks');

export const createTask = ({ title, description = '', column_id, member_id = null, priority = 'medium', due_date = null }) =>
  request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, description, column_id, member_id, priority, due_date }),
  });

export const updateTask = (id, { title, description, member_id, priority, due_date }) =>
  request(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, description, member_id, priority, due_date }),
  });

export const deleteTask = (id) =>
  request(`/api/tasks/${id}`, { method: 'DELETE' });

export const moveTask = (id, { column_id, position }) =>
  request(`/api/tasks/${id}/move`, {
    method: 'PUT',
    body: JSON.stringify({ column_id, position }),
  });
