/* ============================================================
   The Dragon's Watch — app.js
   Vanilla JS, no dependencies
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Constants ─────────────────────────────────────────── */
  const STORAGE_KEY = 'hotd-tasks';

  /* ── State ─────────────────────────────────────────────── */
  let tasks = [];

  /* ── DOM refs ───────────────────────────────────────────── */
  const taskForm      = document.getElementById('task-form');
  const taskInput     = document.getElementById('task-input');
  const taskList      = document.getElementById('task-list');
  const emptyState    = document.getElementById('empty-state');
  const progressText  = document.getElementById('progress-text');
  const progressBar   = document.getElementById('progress-bar');
  const progressFill  = document.getElementById('progress-bar-fill');

  /* ── localStorage helpers ───────────────────────────────── */

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /* ── Progress ───────────────────────────────────────────── */

  function updateProgress() {
    const total     = tasks.length;
    const done      = tasks.filter(t => t.completed).length;
    const pct       = total === 0 ? 0 : Math.round((done / total) * 100);

    progressText.textContent      = `${done} of ${total} done`;
    progressFill.style.width      = `${pct}%`;
    progressFill.setAttribute('aria-valuenow', pct);
    progressBar.setAttribute('aria-valuenow', pct);
  }

  /* ── Empty state ────────────────────────────────────────── */

  function updateEmptyState() {
    if (tasks.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
    }
  }

  /* ── Build a single <li> ────────────────────────────────── */

  function buildTaskItem(task) {
    const li = document.createElement('li');
    li.className  = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    // Checkbox toggle
    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'task-toggle';
    checkbox.checked   = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);

    // Text span
    const span = document.createElement('span');
    span.className   = 'task-text';
    span.textContent = task.text;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.className = 'task-edit';
    editBtn.title     = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type      = 'button';
    deleteBtn.className = 'task-delete';
    deleteBtn.title     = 'Delete';
    deleteBtn.textContent = '🗑️';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);

    li.append(checkbox, span, editBtn, deleteBtn);
    return li;
  }

  /* ── Render all tasks ───────────────────────────────────── */

  function renderTasks() {
    taskList.innerHTML = '';

    tasks.forEach(task => {
      taskList.appendChild(buildTaskItem(task));
    });

    updateProgress();
    updateEmptyState();
  }

  /* ── Add task ───────────────────────────────────────────── */

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    tasks.push({
      id:        crypto.randomUUID(),
      text:      trimmed,
      completed: false
    });

    saveTasks();
    renderTasks();
  }

  /* ── Toggle task ────────────────────────────────────────── */

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }

  /* ── Delete task ────────────────────────────────────────── */

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  /* ── Edit task (inline contenteditable) ─────────────────── */

  function editTask(id, li) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const span = li.querySelector('.task-text');
    if (!span) return;

    // Prevent double-editing
    if (span.getAttribute('contenteditable') === 'true') return;

    const originalText = task.text;

    span.setAttribute('contenteditable', 'true');
    span.focus();

    // Move cursor to end
    const range = document.createRange();
    range.selectNodeContents(span);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function commitEdit() {
      const newText = span.textContent.trim();
      span.setAttribute('contenteditable', 'false');

      if (newText) {
        task.text = newText;
        saveTasks();
        renderTasks();
      } else {
        // Revert to original if empty
        span.textContent = originalText;
      }
    }

    function revertEdit() {
      span.setAttribute('contenteditable', 'false');
      span.textContent = originalText;
    }

    span.addEventListener('blur', commitEdit, { once: true });

    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        span.removeEventListener('blur', commitEdit);
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        span.removeEventListener('blur', commitEdit);
        revertEdit();
      }
    });
  }

  /* ── Event delegation on #task-list ────────────────────── */

  taskList.addEventListener('click', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;

    const id = li.dataset.id;

    if (e.target.matches('.task-toggle')) {
      toggleTask(id);
    } else if (e.target.matches('.task-edit')) {
      editTask(id, li);
    } else if (e.target.matches('.task-delete')) {
      deleteTask(id);
    }
  });

  /* ── Form submit ────────────────────────────────────────── */

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
    taskInput.focus();
  });

  /* ── Init ───────────────────────────────────────────────── */

  tasks = loadTasks();
  renderTasks();

});
