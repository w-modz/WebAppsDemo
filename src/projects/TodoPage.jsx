import React, { useEffect, useMemo, useState } from "react";

const storageKey = "webapps-demo-react-tasks";
const taskApi = "/api/tasks";
const isStaticSite = import.meta.env.MODE === "pages";

function readTasks() {
  const savedTasks = localStorage.getItem(storageKey);
  if (savedTasks === null) return [];

  const tasks = JSON.parse(savedTasks);
  if (!Array.isArray(tasks) || tasks.some((task) =>
    !task || typeof task.id !== "string" || typeof task.content !== "string" || typeof task.deadline !== "string")) {
    throw new Error("Saved tasks are invalid. Clear this site's saved data to start over.");
  }
  return tasks;
}

function saveTasks(tasks) {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function getDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function HighlightedText({ text, query }) {
  const start = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || query.length < 2 || start < 0) return text;
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, start + query.length)}</mark>
      <HighlightedText text={text.slice(start + query.length)} query={query} />
    </>
  );
}

export default function TodoPage() {
  const [tasks, setTasks] = useState([]);
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState(getDefaultDeadline);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      if (isStaticSite) {
        setTasks(readTasks());
        return;
      }
      const response = await fetch(taskApi);
      if (!response.ok) throw new Error("Could not load tasks.");
      setTasks(await response.json());
    }

    loadTasks()
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleTasks = useMemo(() => tasks.filter((task) =>
    task.content.toLowerCase().includes(search.toLowerCase())), [tasks, search]);

  async function submitTask(event) {
    event.preventDefault();
    setError("");
    try {
      if (isStaticSite) {
        const trimmedContent = content.trim();
        const deadlineDate = new Date(deadline);
        if (trimmedContent.length < 3 || trimmedContent.length > 255) {
          throw new Error("Enter a task of 3–255 characters.");
        }
        if (!deadline || Number.isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
          throw new Error("Enter a future deadline.");
        }

        const task = {
          id: crypto.randomUUID(),
          content: trimmedContent,
          deadline: deadlineDate.toISOString(),
          createdAt: new Date().toISOString(),
        };
        const nextTasks = [...tasks, task];
        saveTasks(nextTasks);
        setTasks(nextTasks);
      } else {
        const response = await fetch(taskApi, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim(), deadline: new Date(deadline).toISOString() }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not add task.");
        setTasks((current) => [...current, result]);
      }
      setContent("");
      setDeadline(getDefaultDeadline());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not add task.");
    }
  }

  async function saveEdit(task) {
    setError("");
    try {
      if (isStaticSite) {
        const trimmedContent = editContent.trim();
        if (trimmedContent.length < 3 || trimmedContent.length > 255) {
          throw new Error("Task text must be between 3 and 255 characters.");
        }
        const nextTasks = tasks.map((item) => item.id === task.id ? { ...item, content: trimmedContent } : item);
        saveTasks(nextTasks);
        setTasks(nextTasks);
      } else {
        const response = await fetch(`${taskApi}/${encodeURIComponent(task.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not update task.");
        setTasks((current) => current.map((item) => item.id === result.id ? result : item));
      }
      setEditingId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update task.");
    }
  }

  async function deleteTask(taskId) {
    setError("");
    try {
      if (isStaticSite) {
        const nextTasks = tasks.filter((task) => task.id !== taskId);
        saveTasks(nextTasks);
        setTasks(nextTasks);
      } else {
        const response = await fetch(`${taskApi}/${encodeURIComponent(taskId)}`, { method: "DELETE" });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Could not delete task.");
        }
        setTasks((current) => current.filter((task) => task.id !== taskId));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete task.");
    }
  }

  return (
    <main className="project-page todo-page">
      <section className="todo-app">
        <header className="todo-header">
          <p className="eyebrow">
            {isStaticSite ? "Project A · Tasks saved in this browser" : "Project A · Tasks backed by Node"}
          </p>
          <h1>Todo List</h1>
          <p>
            {isStaticSite
              ? "Your tasks are saved in this browser, not on a server."
              : "Your tasks are saved on the server, not just in this browser."}
          </p>
        </header>
        <label className="todo-search">
          <span className="sr-only">Search tasks</span>
          <input type="search" placeholder="Search tasks..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        {error && <p className="app-error" role="alert">{error}</p>}
        <section className="task-list-container" aria-label="Tasks">
          {loading ? <p className="empty-state">Loading tasks…</p> : visibleTasks.length === 0
            ? <p className="empty-state">{search ? "No matching tasks." : "No tasks yet. Add one below."}</p>
            : <ul className="task-list">
              {visibleTasks.map((task) => (
                <li className="task-item" key={task.id}>
                  <div className="task-content">
                    {editingId === task.id ? (
                      <form className="edit-task-form" onSubmit={(event) => { event.preventDefault(); saveEdit(task); }}>
                        <input aria-label="Edit task" autoFocus value={editContent} onChange={(event) => setEditContent(event.target.value)} />
                        <button type="submit">Save</button>
                        <button type="button" className="button-muted" onClick={() => setEditingId(null)}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        <button className="task-text" type="button" onClick={() => { setEditingId(task.id); setEditContent(task.content); }}>
                          <HighlightedText text={task.content} query={search} />
                        </button>
                        <small>Deadline: {new Date(task.deadline).toLocaleString()}</small>
                      </>
                    )}
                  </div>
                  <button className="delete-btn" type="button" aria-label={`Delete ${task.content}`} onClick={() => deleteTask(task.id)}>Delete</button>
                </li>
              ))}
            </ul>}
        </section>
        <form className="add-task-form" onSubmit={submitTask}>
          <label className="sr-only" htmlFor="new-task">New task</label>
          <input id="new-task" type="text" placeholder="New task..." value={content} onChange={(event) => setContent(event.target.value)} minLength={3} maxLength={255} required />
          <label className="sr-only" htmlFor="task-deadline">Deadline</label>
          <input id="task-deadline" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
          <button type="submit">Add Task</button>
        </form>
      </section>
    </main>
  );
}
