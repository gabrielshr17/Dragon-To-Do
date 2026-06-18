# Changelog

## New Features — v2.0

Four client-requested features added to the original app. All changes stay within the existing three plain files (`index.html`, `styles.css`, `app.js`). No new dependencies introduced.

---

### 1. Explicit Save / Cancel on Edit

**What changed:** Editing a task now shows ✔ and ✖ buttons instead of relying on clicking away or pressing Enter.

**How it works:**
- Click ✏️ → the task text becomes editable and ✔ Save / ✖ Cancel buttons appear
- Click ✔ or press **Enter** to commit the change
- Click ✖ or press **Escape** to discard and revert
- The `mousedown + preventDefault` pattern is used on Save/Cancel so clicking the buttons does not accidentally trigger a blur-commit on the text field

**Files changed:** `styles.css` (`.task-save`, `.task-cancel`, `.task-item.editing` states), `app.js` (`editTask()`)

---

### 2. Drag to Reorder

**What changed:** Tasks can be dragged up and down to change their order, which is then saved to `localStorage`.

**How it works:**
- Each task card has a `⠿` drag handle on the left edge
- Uses the native HTML5 Drag and Drop API — no library required
- Dragging highlights the drop target with a red glow
- On drop, the tasks array is reordered via `splice` and immediately persisted
- Order survives page reload

**Files changed:** `index.html` (no change — handle is built by JS), `styles.css` (`.drag-handle`, `.task-item.dragging`, `.task-item.drag-over`), `app.js` (drag event delegation on `#task-list`)

---

### 3. Due Dates

**What changed:** Tasks can optionally have a due date. Overdue tasks are highlighted in red.

**How it works:**
- A date picker (`<input type="date">`) is added to the add-task form — optional, no value required
- The due date is stored as `YYYY-MM-DD` in the task object
- Displayed on the task card below the task text, formatted as "Jun 20"
- If the due date is before today: the label changes to **"Overdue · Jun 20"** in red (`#c41e1e`)
- Existing tasks saved without a due date continue to work (field defaults to `null`)

**Files changed:** `index.html` (`#due-date-input`), `styles.css` (`.task-due`, `.task-due.overdue`, `.task-body`), `app.js` (`addTask()`, `buildTaskItem()`, `formatDate()`)

---

### 4. Priority Levels

**What changed:** Each task can be assigned a priority (Low / Medium / High), shown as a colored left border on the task card.

**How it works:**
- A `<select>` dropdown is added to the add-task form with options: Low (default), Medium, High
- Priority is stored in the task object as `'low'`, `'medium'`, or `'high'`
- Displayed as a left border color:
  - 🔴 **High** → `#c41e1e` (Targaryen red)
  - 🟡 **Medium** → `#d4a853` (ember gold)
  - ⚫ **Low** → `#3a3a3a` (dark grey)
- Existing tasks saved without a priority default to `'low'`

**Files changed:** `index.html` (`#priority-select`), `styles.css` (`.priority-high`, `.priority-medium`, `.priority-low`), `app.js` (`addTask()`, `buildTaskItem()`)

---

### Data Model Change

| Field | v1 | v2 |
|-------|----|----|
| `id` | ✅ | ✅ |
| `text` | ✅ | ✅ |
| `completed` | ✅ | ✅ |
| `priority` | — | ✅ `'low' \| 'medium' \| 'high'` |
| `dueDate` | — | ✅ `'YYYY-MM-DD' \| null` |

Backward compatible — tasks saved by v1 load correctly in v2 with safe defaults.
