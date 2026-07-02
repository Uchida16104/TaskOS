'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

type TaskStatus = 'todo' | 'doing' | 'done';

type Task = {
  id: number;
  title: string;
  details: string | null;
  status: TaskStatus;
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type TaskFormState = {
  title: string;
  details: string;
  status: TaskStatus;
  priority: string;
  dueDate: string;
};

const emptyForm: TaskFormState = {
  title: '',
  details: '',
  status: 'todo',
  priority: '2',
  dueDate: ''
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To do',
  doing: 'Doing',
  done: 'Done'
};

export function TaskOS() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/tasks', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load tasks');
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const stats = useMemo(() => {
    const todo = tasks.filter((task) => task.status === 'todo').length;
    const doing = tasks.filter((task) => task.status === 'doing').length;
    const done = tasks.filter((task) => task.status === 'done').length;
    return { total: tasks.length, todo, doing, done };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery =
        !needle ||
        task.title.toLowerCase().includes(needle) ||
        (task.details ?? '').toLowerCase().includes(needle);
      const matchesStatus = filter === 'all' || task.status === filter;
      return matchesQuery && matchesStatus;
    });
  }, [tasks, query, filter]);

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        title: form.title,
        details: form.details,
        status: form.status,
        priority: Number(form.priority),
        dueDate: form.dueDate || null
      };

      const response = await fetch(editingId ? `/api/tasks/${editingId}` : '/api/tasks', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Save failed');

      setTasks((current) => {
        if (editingId) {
          return current.map((task) => (task.id === editingId ? data.task : task));
        }
        return [data.task, ...current];
      });
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      details: task.details ?? '',
      status: task.status,
      priority: String(task.priority),
      dueDate: task.due_date ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeTask(id: number) {
    if (!confirm('Delete this task?')) return;
    setError('');
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Delete failed');
      setTasks((current) => current.filter((task) => task.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function cycleStatus(task: Task) {
    const next: TaskStatus = task.status === 'todo' ? 'doing' : task.status === 'doing' ? 'done' : 'todo';
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed');
      setTasks((current) => current.map((item) => (item.id === task.id ? data.task : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  return (
    <main>
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">⌁</div>
            <div>
              <h1>Task OS</h1>
              <p>Render / Vercel ready · Next.js App Router · PostgreSQL</p>
            </div>
          </div>
          <div className="status-chip">
            <span className="status-dot" aria-hidden="true" />
            {loading ? 'Syncing' : `${stats.total} tasks online`}
          </div>
        </header>

        <section className="grid">
          <aside className="panel sidebar">
            <div>
              <h2>Workspace</h2>
              <p style={{ color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.6 }}>
                Native CSS only. The layout is intentionally close to an operating system console so it can later be expanded into XR and gesture-driven interfaces.
              </p>
            </div>

            <div className="kpi-grid">
              <div className="kpi"><strong>{stats.total}</strong><span>Total</span></div>
              <div className="kpi"><strong>{stats.todo}</strong><span>To do</span></div>
              <div className="kpi"><strong>{stats.doing}</strong><span>Doing</span></div>
              <div className="kpi"><strong>{stats.done}</strong><span>Done</span></div>
            </div>

            <form className="form" onSubmit={submitTask}>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Build hand tracking module" required />
              </div>

              <div className="field">
                <label htmlFor="details">Details</label>
                <textarea id="details" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Short spec, checklist, or notes." />
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="status">Status</label>
                  <select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                    <option value="todo">To do</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="priority">Priority</label>
                  <select id="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="dueDate">Due date</label>
                <input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>

              <div className="actions">
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update task' : 'Create task'}
                </button>
                {editingId ? (
                  <button className="btn ghost" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

            {error ? <div className="notice" role="alert">{error}</div> : null}
          </aside>

          <section className="panel content">
            <div className="toolbar">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" aria-label="Search tasks" />
              <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | TaskStatus)} aria-label="Filter by status">
                <option value="all">All</option>
                <option value="todo">To do</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
              <button className="btn" type="button" onClick={loadTasks}>Refresh</button>
            </div>

            <div className="list">
              {loading ? <div className="empty">Loading tasks…</div> : null}
              {!loading && filteredTasks.length === 0 ? <div className="empty">No tasks matched the current filter.</div> : null}

              {filteredTasks.map((task) => (
                <article className="card" key={task.id}>
                  <div className="card-top">
                    <div>
                      <h4>{task.title}</h4>
                      <div className="meta">
                        <span className={`badge ${task.status}`}>{statusLabels[task.status]}</span>
                        <span className="badge">Priority {task.priority}</span>
                        {task.due_date ? <span className="badge">Due {task.due_date}</span> : null}
                      </div>
                    </div>
                    <div className="task-actions">
                      <button className="btn" type="button" onClick={() => cycleStatus(task)}>
                        Move
                      </button>
                      <button className="btn" type="button" onClick={() => beginEdit(task)}>
                        Edit
                      </button>
                      <button className="btn" type="button" onClick={() => removeTask(task.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {task.details ? <p>{task.details}</p> : <p style={{ color: 'var(--muted)' }}>No details yet.</p>}
                  <div className="meta">
                    <span>Updated {new Date(task.updated_at).toLocaleString('ja-JP')}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
