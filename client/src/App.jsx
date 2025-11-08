import './styles.css';
import { useEffect, useMemo, useState } from 'react';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/api/todos?status=${filter}`);
      setTodos(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function addTodo(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const newTodo = await api('/api/todos', { method: 'POST', body: JSON.stringify({ title: text.trim() }) });
      setText('');
      setTodos((t) => [newTodo, ...t]);
    } catch (e) { setError(e.message); }
  }

  async function toggleTodo(id, completed) {
    const prev = todos;
    setTodos((t) => t.map((x) => (x._id === id ? { ...x, completed } : x)));
    try { await api(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) }); }
    catch (e) { setError(e.message); setTodos(prev); }
  }

  async function deleteTodo(id) {
    const prev = todos;
    setTodos((t) => t.filter((x) => x._id !== id));
    try { await api(`/api/todos/${id}`, { method: 'DELETE' }); }
    catch (e) { setError(e.message); setTodos(prev); }
  }

  async function renameTodo(id, title) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const prev = todos;
    setTodos((t) => t.map((x) => (x._id === id ? { ...x, title: trimmed } : x)));
    try { await api(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ title: trimmed }) }); }
    catch (e) { setError(e.message); setTodos(prev); }
  }

  const counts = useMemo(() => ({
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  }), [todos]);

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 20, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}> Todo List</h1>

      <form onSubmit={addTodo} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a new task..."
               style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc' }} />
        <button style={{ padding: '10px 14px', borderRadius: 8, border: 0, background: '#2563eb', color: 'white', cursor: 'pointer' }}>Add</button>
      </form>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['all', 'active', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid #ddd',
                     background: filter === f ? '#111' : 'white', color: filter === f ? 'white' : '#111', cursor: 'pointer' }}>
            {f[0].toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
        <div style={{ marginLeft: 'auto', opacity: 0.9 }}><small></small></div>
      </div>

      {error && <div role="alert" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 }}>{error}</div>}

      {loading ? <div>Loading…</div> :
        todos.length === 0 ? <div style={{ color: '#666' }}>No tasks yet. Add your first one above!</div> :
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {todos.map((t) => (
            <TodoItem key={t._id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} onRename={renameTodo} />
          ))}
        </ul>
      }

      <footer style={{ marginTop: 24, color: '#666' }}><small>Double-click a title to rename. Check to complete. Delete to remove.</small></footer>
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(todo.title);

  useEffect(() => setValue(todo.title), [todo.title]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') { onRename(todo._id, value); setEditing(false); }
    else if (e.key === 'Escape') { setEditing(false); setValue(todo.title); }
  }

  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid #eee', borderRadius: 10 }}>
      <input type="checkbox" checked={todo.completed} onChange={(e) => onToggle(todo._id, e.target.checked)} />
      {editing ? (
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)}
               onBlur={() => { onRename(todo._id, value); setEditing(false); }}
               onKeyDown={handleKeyDown}
               style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #ccc' }} />
      ) : (
        <div onDoubleClick={() => setEditing(true)}
             style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? '#6b7280' : '#111' }}>
          {todo.title}
        </div>
      )}
      <button onClick={() => onDelete(todo._id)}
              style={{ border: 0, background: '#ef4444', color: 'white', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>
        Delete
      </button>
    </li>
  );
}
