class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        this.taskListEl = document.getElementById('taskList');
        this.newTaskInput = document.getElementById('newTaskInput');
        this.deadlineInput = document.getElementById('taskDeadline');
        this.searchInput = document.getElementById('searchInput');
        this.addButton = null;

        this.handleAdd = this.handleAdd.bind(this);
        this.handleSearch = this.handleSearch.bind(this);

        document.addEventListener('DOMContentLoaded', () => {
            this.addButton = document.querySelector('[onclick="addTask()"]');
            if (this.addButton) {
                this.addButton.removeAttribute('onclick');
                this.addButton.addEventListener('click', this.handleAdd);
            }

            if (this.searchInput) this.searchInput.addEventListener('input', this.handleSearch);

            this.setDefaultDate();
            this.draw();
        });
    }

    save() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    draw(renderIndices = null) {
        const searchQuery = this.searchInput ? this.searchInput.value.toLowerCase() : '';
        const indices = renderIndices || this.tasks.map((_, i) => i);

        this.taskListEl.innerHTML = '';

        indices.forEach((taskIndex) => {
            const task = this.tasks[taskIndex];
            const li = document.createElement('li');
            li.className = 'task-item';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content';

            if (searchQuery && searchQuery.length >= 2) {
                const regex = new RegExp(`(${searchQuery})`, 'gi');
                contentDiv.innerHTML = task.content.replace(regex, '<span class="highlight">$1</span>');
            } else {
                contentDiv.textContent = task.content;
            }

            if (task.deadline) {
                const deadline = new Date(task.deadline);
                contentDiv.innerHTML += `<br><small>Deadline: ${deadline.toLocaleString()}</small>`;
            }

            contentDiv.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = task.content;
                input.style.width = '80%';

                const saveEdit = () => {
                    const newContent = input.value.trim();
                    if (this.validateTask(newContent, task.deadline)) {
                        this.editTask(taskIndex, newContent);
                    } else {
                        setTimeout(() => input.focus(), 0);
                    }
                };

                input.addEventListener('blur', saveEdit);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        if (this.validateTask(input.value.trim(), task.deadline)) {
                            saveEdit();
                        } else {
                            e.preventDefault();
                        }
                    }
                });

                contentDiv.innerHTML = '';
                contentDiv.appendChild(input);
                input.focus();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️';
            deleteBtn.addEventListener('click', () => this.deleteTask(taskIndex));

            li.appendChild(contentDiv);
            li.appendChild(deleteBtn);
            this.taskListEl.appendChild(li);
        });
    }

    validateTask(content, deadline) {
        if (!content || content.length < 3) {
            alert('Task must be at least 3 characters long!');
            return false;
        }
        if (content.length > 255) {
            alert('Task cannot be longer than 255 characters!');
            return false;
        }
        if (!deadline) {
            alert('Deadline is required!');
            return false;
        }
        const deadlineDate = new Date(deadline);
        const now = new Date();
        if (deadlineDate <= now) {
            alert('Deadline must be in the future!');
            return false;
        }
        return true;
    }

    addTask(content, deadline) {
        this.tasks.push({ content, deadline, createdAt: new Date().toISOString() });
        this.save();
        this.draw();
    }

    handleAdd() {
        const content = this.newTaskInput.value.trim();
        const deadline = this.deadlineInput.value;
        if (this.validateTask(content, deadline)) {
            this.addTask(content, deadline);
            this.newTaskInput.value = '';
        }
    }

    editTask(index, newContent) {
        this.tasks[index].content = newContent;
        this.save();
        this.draw();
    }

    deleteTask(index) {
        this.tasks.splice(index, 1);
        this.save();
        this.draw();
    }

    handleSearch(e) {
        const query = e.target.value.toLowerCase();
        if (query.length >= 2) {
            const matched = [];
            this.tasks.forEach((t, i) => {
                if (t.content.toLowerCase().includes(query)) matched.push(i);
            });
            this.draw(matched);
        } else {
            this.draw();
        }
    }

    setDefaultDate() {
        const now = new Date();
        now.setDate(now.getDate() + 1);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        if (this.deadlineInput) this.deadlineInput.value = defaultDateTime;
    }
}

const todoApp = new TodoApp();
