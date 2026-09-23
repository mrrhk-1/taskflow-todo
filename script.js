const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const prioritySelect = document.getElementById("prioritySelect");
const dueDate = document.getElementById("dueDate");
const categorySelect = document.getElementById("categorySelect");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");
const themeBtn = document.getElementById("themeBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const pendingCount = document.getElementById("pendingCount");
const overdueCount = document.getElementById("overdueCount");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const taskSummary = document.getElementById("taskSummary");

const editModal = document.getElementById("editModal");
const closeModal = document.getElementById("closeModal");
const editForm = document.getElementById("editForm");
const editTitle = document.getElementById("editTitle");
const editPriority = document.getElementById("editPriority");
const editDueDate = document.getElementById("editDueDate");
const editCategory = document.getElementById("editCategory");

let tasks = JSON.parse(localStorage.getItem("taskflowTasks")) || [];
let editId = null;

function saveTasks() {
    localStorage.setItem("taskflowTasks", JSON.stringify(tasks));
}

function createId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function formatDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(task.dueDate + "T00:00:00");
    return date < today;
}

function priorityNumber(priority) {
    if (priority === "high") return 1;
    if (priority === "medium") return 2;
    return 3;
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(task => isOverdue(task)).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalCount.textContent = total;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
    overdueCount.textContent = overdue;
    progressText.textContent = progress + "%";
    progressBar.style.width = progress + "%";

    if (total === 0) {
        taskSummary.textContent = "No tasks yet.";
    } else {
        taskSummary.textContent = `${completed} of ${total} task${total === 1 ? "" : "s"} completed`;
    }
}

function renderTasks() {
    const search = searchInput.value.toLowerCase().trim();
    const filter = filterSelect.value;
    const sort = sortSelect.value;

    let visibleTasks = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            task.category.toLowerCase().includes(search);

        let matchesFilter = true;

        if (filter === "active") matchesFilter = !task.completed;
        if (filter === "completed") matchesFilter = task.completed;
        if (filter === "overdue") matchesFilter = isOverdue(task);

        return matchesSearch && matchesFilter;
    });

    if (sort === "newest") {
        visibleTasks.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === "oldest") {
        visibleTasks.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sort === "priority") {
        visibleTasks.sort((a, b) => priorityNumber(a.priority) - priorityNumber(b.priority));
    } else if (sort === "due") {
        visibleTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        });
    }

    taskList.innerHTML = "";

    if (visibleTasks.length === 0) {
        emptyState.style.display = "block";
    } else {
        emptyState.style.display = "none";

        visibleTasks.forEach(task => {
            const item = document.createElement("div");
            item.className = "task" + (task.completed ? " completed" : "");

            const priorityName =
                task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

            let dueBadge = "";
            if (task.dueDate) {
                dueBadge = `<span class="badge ${isOverdue(task) ? "overdue" : ""}">
                    ${isOverdue(task) ? "Overdue · " : "Due · "}${formatDate(task.dueDate)}
                </span>`;
            }

            item.innerHTML = `
                <button class="check-btn" title="Mark complete">${task.completed ? "✓" : ""}</button>

                <div>
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-info">
                        <span class="badge priority-${task.priority}">${priorityName}</span>
                        <span class="badge">${escapeHtml(task.category)}</span>
                        ${dueBadge}
                    </div>
                </div>

                <div class="task-actions">
                    <button class="action-btn edit-btn">Edit</button>
                    <button class="action-btn delete-btn">Delete</button>
                </div>
            `;

            item.querySelector(".check-btn").addEventListener("click", () => toggleTask(task.id));
            item.querySelector(".edit-btn").addEventListener("click", () => openEdit(task.id));
            item.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

            taskList.appendChild(item);
        });
    }

    updateStats();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) return;

    tasks.push({
        id: createId(),
        title: title,
        priority: prioritySelect.value,
        dueDate: dueDate.value,
        category: categorySelect.value,
        completed: false,
        createdAt: Date.now()
    });

    saveTasks();
    taskForm.reset();
    prioritySelect.value = "medium";
    categorySelect.value = "Study";
    renderTasks();
    taskTitle.focus();
});

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });

    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    const task = tasks.find(item => item.id === id);

    if (task && confirm(`Delete "${task.title}"?`)) {
        tasks = tasks.filter(item => item.id !== id);
        saveTasks();
        renderTasks();
    }
}

function openEdit(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    editId = id;
    editTitle.value = task.title;
    editPriority.value = task.priority;
    editDueDate.value = task.dueDate;
    editCategory.value = task.category;

    editModal.classList.remove("hidden");
    editTitle.focus();
}

function closeEdit() {
    editModal.classList.add("hidden");
    editId = null;
}

editForm.addEventListener("submit", function(event) {
    event.preventDefault();

    tasks = tasks.map(task => {
        if (task.id === editId) {
            return {
                ...task,
                title: editTitle.value.trim(),
                priority: editPriority.value,
                dueDate: editDueDate.value,
                category: editCategory.value
            };
        }

        return task;
    });

    saveTasks();
    closeEdit();
    renderTasks();
});

closeModal.addEventListener("click", closeEdit);

editModal.addEventListener("click", function(event) {
    if (event.target === editModal) {
        closeEdit();
    }
});

clearCompletedBtn.addEventListener("click", function() {
    const completed = tasks.filter(task => task.completed).length;

    if (completed === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    if (confirm(`Clear ${completed} completed task${completed === 1 ? "" : "s"}?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
    }
});

searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);
sortSelect.addEventListener("change", renderTasks);

themeBtn.addEventListener("click", function() {
    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");
    localStorage.setItem("taskflowTheme", dark ? "dark" : "light");
    themeBtn.textContent = dark ? "☀" : "☾";
});

if (localStorage.getItem("taskflowTheme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "☀";
}

renderTasks();
