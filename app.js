/* ============================================================
   The Dragon's Watch — app.js
   Vanilla JS, no dependencies
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Constants ─────────────────────────────────────────── */
  const STORAGE_KEY = 'hotd-tasks';

  /* ── State ─────────────────────────────────────────────── */
  let tasks = [];
  let draggedId = null;

  /* ── DOM refs ───────────────────────────────────────────── */
  const taskForm       = document.getElementById('task-form');
  const taskInput      = document.getElementById('task-input');
  const prioritySelect = document.getElementById('priority-select');
  const dueDateInput   = document.getElementById('due-date-input');
  const taskList       = document.getElementById('task-list');
  const emptyState     = document.getElementById('empty-state');
  const progressText   = document.getElementById('progress-text');
  const progressBar    = document.getElementById('progress-bar');
  const progressFill   = document.getElementById('progress-bar-fill');

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

  /* ── Date helpers ───────────────────────────────────────── */

  function todayStr() {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function formatDate(dateStr) {
    // dateStr is YYYY-MM-DD; parse as local date
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /* ── Progress ───────────────────────────────────────────── */

  function updateProgress() {
    const total = tasks.length;
    const done  = tasks.filter(t => t.completed).length;
    const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

    progressText.textContent = `${done} of ${total} done`;
    progressFill.style.width = `${pct}%`;
    progressFill.setAttribute('aria-valuenow', pct);
    progressBar.setAttribute('aria-valuenow', pct);
  }

  /* ── Empty state ────────────────────────────────────────── */

  function updateEmptyState() {
    emptyState.style.display = tasks.length === 0 ? 'block' : 'none';
  }

  /* ── Build a single <li> ────────────────────────────────── */

  function buildTaskItem(task) {
    const priority = task.priority ?? 'low';
    const dueDate  = task.dueDate  ?? null;
    const today    = todayStr();

    const li = document.createElement('li');
    li.className  = `task-item priority-${priority}${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;
    li.draggable  = true;

    // Drag handle
    const handle = document.createElement('span');
    handle.className   = 'drag-handle';
    handle.textContent = '⠿';
    handle.setAttribute('aria-hidden', 'true');

    // Checkbox toggle
    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'task-toggle';
    checkbox.checked   = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);

    // Task body: text + due date stacked
    const body = document.createElement('div');
    body.className = 'task-body';

    const span = document.createElement('span');
    span.className   = 'task-text';
    span.textContent = task.text;

    body.appendChild(span);

    if (dueDate) {
      const dueSpan = document.createElement('span');
      dueSpan.className = 'task-due' + (dueDate < today ? ' overdue' : '');
      dueSpan.textContent = (dueDate < today ? 'Overdue · ' : '') + formatDate(dueDate);
      body.appendChild(dueSpan);
    }

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type        = 'button';
    editBtn.className   = 'task-edit';
    editBtn.title       = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);

    // Save button (hidden until editing)
    const saveBtn = document.createElement('button');
    saveBtn.type        = 'button';
    saveBtn.className   = 'task-save';
    saveBtn.title       = 'Save';
    saveBtn.textContent = '✔';
    saveBtn.setAttribute('aria-label', 'Save edit');

    // Cancel button (hidden until editing)
    const cancelBtn = document.createElement('button');
    cancelBtn.type        = 'button';
    cancelBtn.className   = 'task-cancel';
    cancelBtn.title       = 'Cancel';
    cancelBtn.textContent = '✖';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type        = 'button';
    deleteBtn.className   = 'task-delete';
    deleteBtn.title       = 'Delete';
    deleteBtn.textContent = '🗑️';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);

    li.append(handle, checkbox, body, editBtn, saveBtn, cancelBtn, deleteBtn);
    return li;
  }

  /* ── Render all tasks ───────────────────────────────────── */

  function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(task => taskList.appendChild(buildTaskItem(task)));
    updateProgress();
    updateEmptyState();
  }

  /* ── Add task ───────────────────────────────────────────── */

  function addTask(text) {
    const trimmed  = text.trim();
    if (!trimmed) return;

    const priority = prioritySelect.value;
    const dueDate  = dueDateInput.value || null;

    tasks.push({
      id:        crypto.randomUUID(),
      text:      trimmed,
      completed: false,
      priority,
      dueDate,
    });

    dueDateInput.value = '';
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

  /* ── Edit task (inline contenteditable + save/cancel btns) ─ */

  function editTask(id, li) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const span = li.querySelector('.task-text');
    if (!span || li.classList.contains('editing')) return;

    const originalText = task.text;

    li.classList.add('editing');
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
      li.classList.remove('editing');

      if (newText) {
        task.text = newText;
        saveTasks();
        renderTasks();
      } else {
        span.textContent = originalText;
      }
    }

    function revertEdit() {
      span.setAttribute('contenteditable', 'false');
      span.textContent = originalText;
      li.classList.remove('editing');
    }

    const saveBtn   = li.querySelector('.task-save');
    const cancelBtn = li.querySelector('.task-cancel');

    // mousedown preventDefault stops blur firing before click
    saveBtn.addEventListener('mousedown', e => e.preventDefault(), { once: true });
    saveBtn.addEventListener('click', commitEdit, { once: true });

    cancelBtn.addEventListener('mousedown', e => e.preventDefault(), { once: true });
    cancelBtn.addEventListener('click', revertEdit, { once: true });

    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        revertEdit();
      }
    });
  }

  /* ── Drag-and-drop (event delegation on #task-list) ────── */

  taskList.addEventListener('dragstart', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;
    draggedId = li.dataset.id;
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
  });

  taskList.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const li = e.target.closest('.task-item');
    if (!li || li.dataset.id === draggedId) return;
    // Remove drag-over from all, then set on current target
    taskList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    li.classList.add('drag-over');
  });

  taskList.addEventListener('dragleave', (e) => {
    const li = e.target.closest('.task-item');
    if (li) li.classList.remove('drag-over');
  });

  taskList.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetLi = e.target.closest('.task-item');
    if (!targetLi || !draggedId || targetLi.dataset.id === draggedId) return;

    const fromIndex = tasks.findIndex(t => t.id === draggedId);
    const toIndex   = tasks.findIndex(t => t.id === targetLi.dataset.id);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, moved);

    saveTasks();
    renderTasks();
  });

  taskList.addEventListener('dragend', () => {
    taskList.querySelectorAll('.dragging, .drag-over').forEach(el => {
      el.classList.remove('dragging', 'drag-over');
    });
    draggedId = null;
  });

  /* ── Event delegation on #task-list (click) ────────────── */

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
