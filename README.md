# The Dragon's Watch 🐉

A task management app styled after the world of **House of the Dragon** — bold, dark, and built to get things done.

## Overview

A lightweight to-do list app built with plain HTML, CSS, and JavaScript. No frameworks, no build step, no backend. Open `index.html` directly in any browser or host it for free as a static page.

## Features

- **Add tasks** — type and press Enter or click "Add Task"
- **Complete tasks** — click the checkbox to mark done; completed tasks are dimmed and struck through
- **Edit tasks** — click ✏️ to edit inline; press Enter to save or Escape to cancel
- **Delete tasks** — click 🗑️ to remove a task
- **Progress tracking** — "X of Y done" counter and animated progress bar update in real time
- **Empty state** — a thematic message appears when the list is clear
- **Persistent storage** — all tasks survive page reloads via `localStorage`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (semantic) |
| Style | CSS3 (custom properties, animations, flexbox) |
| Logic | Vanilla JavaScript (ES2020+) |
| Storage | Browser `localStorage` |
| Fonts | Google Fonts — Cinzel + Inter |

## File Structure

```
├── index.html   # Markup and page structure
├── styles.css   # House of the Dragon theme
└── app.js       # Task logic and localStorage
```

## Theme

- **Palette:** near-black backgrounds (`#0a0a0a`, `#141414`), Targaryen blood red (`#8b0000`, `#c41e1e`), ember gold (`#d4a853`)
- **Fonts:** Cinzel (ornate, for headings) + Inter (clean, for task text)
- **Effects:** ember-pulse glow animation on the title, red focus rings, smooth hover transitions

## Usage

1. Clone or download the repository
2. Open `index.html` in a browser — no server required
3. To host online, upload the three files to any static host (GitHub Pages, Netlify, Vercel, etc.)

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires `crypto.randomUUID()` support (available since 2021).
