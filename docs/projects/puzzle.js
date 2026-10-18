const storageKey = "webapps-demo-static-tasks";

const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const newTaskInput = document.getElementById("new-task");
const deadlineInput = document.getElementById("task-deadline");
const searchInput = document.getElementById("search-input");
const errorEl = document.getElementById("error");

function getDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function getTasks() {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function setError(message) {
  errorEl.textContent = message || "";
  errorEl.hidden = !message;
}

function renderTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const tasks = getTasks().filter((task) => task.content.toLowerCase().includes(query));

  if (!tasks.length) {
    taskList.innerHTML = `<li class="empty-state">${query ? "No matching tasks." : "No tasks yet. Add one below."}</li>`;
    return;
  }

  taskList.innerHTML = tasks
    .map((task) => {
      const isEditing = task.id === taskList.dataset.editingId;
      if (isEditing) {
        return `
          <li class="task-item">
            <div class="task-content">
              <form class="edit-task-form" data-edit-id="${task.id}">
                <input aria-label="Edit task" value="${escapeHtml(task.content)}" name="edit-content" />
                <button type="submit">Save</button>
                <button type="button" class="button-muted" data-cancel-edit="${task.id}">Cancel</button>
              </form>
            </div>
          </li>
        `;
      }

      return `
        <li class="task-item" data-task-id="${task.id}">
          <div class="task-content">
            <button class="task-text" type="button" data-edit="${task.id}">${highlightText(task.content, query)}</button>
            <small>Deadline: ${new Date(task.deadline).toLocaleString()}</small>
          </div>
          <button class="delete-btn" type="button" data-delete="${task.id}">Delete</button>
        </li>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function highlightText(text, query) {
  if (!query || query.length < 2) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return text;
  const first = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const rest = text.slice(index + query.length);
  return `${first}<mark>${match}</mark>${highlightText(rest, query)}`;
}

function addTask(event) {
  event.preventDefault();
  const content = newTaskInput.value.trim();
  const deadlineValue = deadlineInput.value;

  if (!content || content.length < 3 || content.length > 255) {
    setError("Enter a task of 3–255 characters.");
    return;
  }

  if (!deadlineValue || Number.isNaN(new Date(deadlineValue).getTime()) || new Date(deadlineValue) <= new Date()) {
    setError("Enter a future deadline.");
    return;
  }

  const tasks = getTasks();
  tasks.push({
    id: crypto.randomUUID(),
    content,
    deadline: new Date(deadlineValue).toISOString(),
    createdAt: new Date().toISOString(),
  });

  saveTasks(tasks);
  newTaskInput.value = "";
  deadlineInput.value = getDefaultDeadline();
  setError("");
  renderTasks();
}

function deleteTask(taskId) {
  const tasks = getTasks().filter((task) => task.id !== taskId);
  saveTasks(tasks);
  renderTasks();
}

function startEditing(taskId) {
  taskList.dataset.editingId = taskId;
  renderTasks();
}

function confirmEdit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const taskId = form.dataset.editId;
  const input = form.querySelector("input[name='edit-content']");
  const value = input.value.trim();

  if (!value || value.length < 3 || value.length > 255) {
    setError("Task text must be between 3 and 255 characters.");
    return;
  }

  const tasks = getTasks().map((task) => task.id === taskId ? { ...task, content: value } : task);
  saveTasks(tasks);
  delete taskList.dataset.editingId;
  setError("");
  renderTasks();
}

function cancelEdit() {
  delete taskList.dataset.editingId;
  renderTasks();
}

taskForm.addEventListener("submit", addTask);
searchInput.addEventListener("input", renderTasks);

taskList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete]");
  if (deleteButton) {
    deleteTask(deleteButton.dataset.delete);
    return;
  }

  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    startEditing(editButton.dataset.edit);
    return;
  }

  const cancelButton = event.target.closest("[data-cancel-edit]");
  if (cancelButton) {
    cancelEdit();
  }
});

taskList.addEventListener("submit", (event) => {
  const form = event.target.closest(".edit-task-form");
  if (form) {
    confirmEdit(event);
  }
});

deadlineInput.value = getDefaultDeadline();
renderTasks();
