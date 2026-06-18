/* ============================================================
   The Dragon's Watch — app.js
   Vanilla JS, no dependencies
   ============================================================ */

/* ── SVG icon library ───────────────────────────────────────── */
const ICONS = {
  drag: `<svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="3.5" cy="3"  rx="3" ry="2"/>
    <ellipse cx="8.5" cy="3"  rx="3" ry="2"/>
    <ellipse cx="3.5" cy="9"  rx="3" ry="2"/>
    <ellipse cx="8.5" cy="9"  rx="3" ry="2"/>
    <ellipse cx="3.5" cy="15" rx="3" ry="2"/>
    <ellipse cx="8.5" cy="15" rx="3" ry="2"/>
  </svg>`,

  edit: `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="2" y1="13" x2="10" y2="5"/>
    <line x1="8.5" y1="3.5" x2="12" y2="7"/>
    <line x1="10" y1="2" x2="13" y2="5"/>
    <circle cx="2.2" cy="12.8" r="1.3" fill="currentColor" stroke="none"/>
  </svg>`,

  delete: `<svg width="13" height="16" viewBox="0 0 13 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6.5 0 C6.5 0 12 4.5 12 9 C12 12.2 9.8 15 6.5 16 C3.2 15 1 12.2 1 9 C1 5.5 4 3 5.3 5.3 C5 2.8 6.5 0 6.5 0Z" opacity="0.92"/>
    <path d="M6.5 8.5 C6.5 8.5 8.8 10.2 8.2 12.3 C7.8 13.3 5.2 13.3 4.8 12.3 C4.2 10.2 6.5 8.5 6.5 8.5Z" fill="#0a0a0a" opacity="0.45"/>
  </svg>`,

  save: `<svg width="16" height="13" viewBox="0 0 16 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1 11 L1 6.5 L4.2 9.5 L8 2 L11.8 9.5 L15 6.5 L15 11 Z"/>
    <line x1="1" y1="12.5" x2="15" y2="12.5"/>
  </svg>`,

  cancel: `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="2" y1="2"  x2="11" y2="11"/>
    <line x1="11" y1="2" x2="2"  y2="11"/>
  </svg>`,
};

/* ── Animation utility ──────────────────────────────────────── */
function animate(el, cls, duration = 750) {
  el.classList.remove(cls);
  void el.offsetWidth; // force reflow so re-trigger works
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), duration);
}

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
  const addBtn         = document.getElementById('add-btn');
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
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    // Drag handle (dragon scales)
    const handle = document.createElement('span');
    handle.className   = 'drag-handle';
    handle.innerHTML   = ICONS.drag;
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
      dueSpan.className   = 'task-due' + (dueDate < today ? ' overdue' : '');
      dueSpan.textContent = (dueDate < today ? 'Overdue · ' : '') + formatDate(dueDate);
      body.appendChild(dueSpan);
    }

    // Edit button (sword icon)
    const editBtn = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.className = 'task-edit icon-btn';
    editBtn.title     = 'Edit';
    editBtn.innerHTML = ICONS.edit;
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);

    // Save button — crown icon (hidden until editing)
    const saveBtn = document.createElement('button');
    saveBtn.type      = 'button';
    saveBtn.className = 'task-save icon-btn';
    saveBtn.title     = 'Save';
    saveBtn.innerHTML = ICONS.save;
    saveBtn.setAttribute('aria-label', 'Save edit');

    // Cancel button — rune X (hidden until editing)
    const cancelBtn = document.createElement('button');
    cancelBtn.type      = 'button';
    cancelBtn.className = 'task-cancel icon-btn';
    cancelBtn.title     = 'Cancel';
    cancelBtn.innerHTML = ICONS.cancel;
    cancelBtn.setAttribute('aria-label', 'Cancel edit');

    // Delete button (flame icon)
    const deleteBtn = document.createElement('button');
    deleteBtn.type      = 'button';
    deleteBtn.className = 'task-delete icon-btn';
    deleteBtn.title     = 'Delete';
    deleteBtn.innerHTML = ICONS.delete;
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
    const trimmed = text.trim();
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
    animate(addBtn, 'anim-fire-burst', 600);
  }

  /* ── Toggle task ────────────────────────────────────────── */

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();

    // Animate the li before re-rendering
    const li = taskList.querySelector(`[data-id="${id}"]`);
    if (li) {
      animate(li, 'anim-dragon-breath', 650);
      setTimeout(() => renderTasks(), 100);
    } else {
      renderTasks();
    }
  }

  /* ── Delete task ────────────────────────────────────────── */

  function deleteTask(id) {
    const li = taskList.querySelector(`[data-id="${id}"]`);
    if (li) {
      li.classList.add('anim-flame-out');
      setTimeout(() => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
      }, 440);
    } else {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }
  }

  /* ── Edit task ──────────────────────────────────────────── */

  function editTask(id, li) {
    const task = tasks.find(t => t.id === id);
    if (!task || li.classList.contains('editing')) return;

    animate(li, 'anim-sword-slash', 350);

    const span = li.querySelector('.task-text');
    if (!span) return;

    const originalText = task.text;

    setTimeout(() => {
      li.classList.add('editing');
      span.setAttribute('contenteditable', 'true');
      span.focus();

      const range = document.createRange();
      range.selectNodeContents(span);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }, 120);

    function commitEdit() {
      const newText = span.textContent.trim();
      span.setAttribute('contenteditable', 'false');
      li.classList.remove('editing');

      if (newText) {
        task.text = newText;
        saveTasks();
        animate(li, 'anim-gold-shimmer', 800);
        setTimeout(() => renderTasks(), 100);
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

  /* ── Drag-and-drop ──────────────────────────────────────── */

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

  /* ── Click delegation ───────────────────────────────────── */

  taskList.addEventListener('click', (e) => {
    const li = e.target.closest('.task-item');
    if (!li) return;

    const id = li.dataset.id;

    if (e.target.closest('.task-toggle')) {
      toggleTask(id);
    } else if (e.target.closest('.task-edit')) {
      editTask(id, li);
    } else if (e.target.closest('.task-delete')) {
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

  dueDateInput.min = todayStr();
  tasks = loadTasks();
  renderTasks();

});
