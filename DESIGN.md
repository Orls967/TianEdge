# Visual Identity & UI/UX Design Specification — TIANEDGE

**Document ID:** `TIANEDGE-DES-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Visual Theme:** Semiconductor Engineering Laboratory + Digital Technology Museum  
**Viewport Priority:** Web-Based, Desktop-First (`>= 1280px` primary, responsive down to `360px`)  

---

## 1. Visual Direction & Design Principles

TIANEDGE merges the technical rigor of a **Semiconductor Engineering Laboratory** (precision measurement ticks, crisp vector hairlines, dark optical contrast, telemetry accuracy) with the spatial elegance of a **Digital Technology Museum** (cinematic 3D stage lighting, clean architectural storytelling, generous breathing room).

### Core Design Rules

1. **3D Stage Is Primary, Not Decoration:** The interactive WebGL viewport occupies the visual center (`60%–75%` of viewport real estate in exploration and hero states); HUD panels float cleanly alongside or dock via crisp glassmorphic dark graphite frames.
2. **Avoid Generic SaaS Dashboards:** No noisy multi-widget grid cards, pastel gradients, or generic metric KPI tiles. Use precision monospace readouts, thin `1px` architectural hairlines, and purposeful optical depth.
3. **Color Means Function:** Electric cyan signals active *data flow* and primary focus; warm gold signals *control signals*, memory highlights, and architectural accents; amber signals *warnings/thermal stress*; crimson signals *execution faults*.
4. **Representation Clarity:** Enlarged conceptual logic circuits (`Digital Logic Foundation`) must display an explicit visual badge (`CONCEPTUAL MODEL — NOT TO SCALE`) so aesthetic immersion never misleads learners.

---

## 2. Color System & Design Tokens

All contrast pairings meet **WCAG 2.1 AA** (`>= 4.5:1` for body text, `>= 3:1` for large labels and UI graphics).

```css
:root {
  /* Backgrounds — Dark Graphite Optical Stage */
  --bg-canvas: #070A10;          /* Deep laboratory void behind 3D canvas */
  --bg-surface: #0D121C;         /* Primary dark graphite HUD panel surface */
  --bg-surface-elevated: #141B29;/* Floating drawers, modals, tooltips */
  --bg-surface-glass: rgba(13, 18, 28, 0.84);

  /* Borders & Hairlines */
  --border-subtle: rgba(148, 163, 184, 0.16);
  --border-active: rgba(0, 229, 255, 0.55);

  /* Brand & Functional Accents */
  --accent-primary: #00E5FF;     /* Electric Cyan — primary focus, hover halo, buttons */
  --accent-signal: #22D3EE;      /* Active Signal Glow — 3D data path pulses */
  --accent-secondary: #1E40AF;   /* Deep Blue — substrate/structural accents */
  --accent-secondary-soft: #1D4ED8;
  --accent-warm-gold: #FBBF24;   /* Warm Gold — control signals, register writes, highlights */

  /* Typography */
  --text-primary: #F8FAFC;       /* Crisp laboratory white (contrast >15:1 on #0D121C) */
  --text-secondary: #CBD5E1;     /* High-legibility technical prose */
  --text-muted: #94A3B8;         /* Metadata labels, units, breadcrumbs */

  /* Semantic Status */
  --status-success: #10B981;     /* Valid parse / completed execution */
  --status-warning: #F59E0B;     /* Amber — thermal alerts, offline mode, bypassed stage */
  --status-error: #EF4444;       /* Assembly syntax fault / out-of-bounds memory trap */
}
```

### 3D Scene Environment Lighting Tokens

- **Viewport Backdrop:** Radial dark graphite gradient (`#0B101B` center -> `#05070B` edge) to make metallic copper/silicon PBR reflections pop cleanly.
- **Key Directional Light:** Cool neutral white (`#F1F5F9`, intensity `2.2`) casting crisp architectural relief across die blocks and IHS bevels.
- **Rim Light:** Deep blue (`#3B82F6`, intensity `1.1`) tracing chip edges.
- **Fill / Warm Accent:** Subtle warm gold (`#FDE68A`, intensity `0.45`) catching gold LGA contact pads and copper substrate traces.

---

## 3. Typography & Spacing Scale

### Font Families

- **Display / Headings:** `'Space Grotesk', 'Inter', system-ui, sans-serif` — geometric engineering precision.
- **UI & Technical Prose:** `'Inter', system-ui, sans-serif` — neutral high legibility across long-form explanations.
- **Telemetry / ISA / Hex / Equations:** `'JetBrains Mono', 'Fira Code', ui-monospace, monospace` — mandatory `font-variant-numeric: tabular-nums` so register and cycle counters never jitter horizontally during rapid updates.

### Type Scale & Spacing

| Token | Size / Line-Height | Usage |
|---|---|---|
| `--text-hero` | `clamp(2rem, 3.5vw, 3.25rem) / 1.1` | Overview title, section display headers |
| `--text-h2` | `1.5rem / 1.25` | Page headers, active component title |
| `--text-h3` | `1.125rem / 1.35` | Inspector section headings (`Engineering Principle`, `Operation`) |
| `--text-body` | `0.9375rem (15px) / 1.65` | Technical documentation body (`max-width: 68ch`) |
| `--text-mono-sm` | `0.8125rem (13px) / 1.45` | Assembly editor, register banks, memory grid, `PC`/`IR` |
| `--text-caption` | `0.75rem (12px) / 1.4` | Representation badges, units, telemetry labels |

Spacing uses a strict **4px baseline grid** (`4, 8, 12, 16, 24, 32, 48px`) with panel padding standardized at `16px–20px` and consistent `12px` inner gutters.

---

## 4. Navigation & Multi-Page Spatial Architecture

### Global Top Navigation Bar (`56px` height)

- **Left:** `TIANEDGE` wordmark + miniature geometric silicon-die emblem.
- **Center (6 Canonical Routes):**
  1. `Overview` (`/`)
  2. `Chip Anatomy` (`/anatomy`)
  3. `Instruction Journey` (`/journey`)
  4. `CPU Simulator` (`/simulator`)
  5. `Engineering Insights` (`/insights`)
  6. `Technical Library` (`/library`)
- **Right Utility Cluster:**
  - WASM Engine Status pill (`WASM Ready` emerald dot)
  - Content Sync badge (`API Synced` or non-intrusive `Local Mode` amber/slate pill when offline)
  - Accessibility Reduced-Motion toggle button (`Pause Motion` / `Motion Active`)

### Section Layout Blueprints

1. **Overview (`/`):** Split hero composition — left editorial column (Title, *Explore the Architecture. Understand the Intelligence.*, 3 Principle CTAs `Explore` -> `/anatomy`, `Understand` -> `/insights`, `Experience` -> `/simulator`); right/full-bleed interactive 3D hero processor stage (`Full Assembly` with idle orbit + interactive click-through).
2. **Chip Anatomy (`/anatomy`):** Three-zone laboratory workspace:
   - **Left Collapsible Rail (`280px`):** 6-Group Component Hierarchy Tree (`cpu-package` .. `communication-control`) with visibility toggles and search filter.
   - **Center Viewport (`1fr`):** Full-height WebGL 3D Canvas + floating bottom Mode Bar (`Full Assembly`, `Exploded View`, `Section Cut`, `Component Isolation`, `Internal Architecture`, `Signal Flow`) + floating camera controls (`Reset Camera`, `Zoom +/-`, `Section Slice Slider` when in `Section Cut` mode).
   - **Right Inspector Drawer (`380px–420px`):** Displays selected `ChipComponent`'s representation badge, Overview, Function, Engineering Principle, Internal Structure, Operation, System Relationships (clickable cross-links), Technical Parameters table, Real-World Context, and `"Related Insights"` links.
3. **Instruction Journey (`/journey`):** Split workspace — **Left/Center (`65%`)** synchronized 3D core view with guided camera focus and animated cyan/gold paths; **Right (`35%`)** Stage Sequencer card (`1. Fetch` .. `6. Write Back`), active component pills, data payload snapshot, step controls (`Prev`, `Play/Pause`, `Next`, `Reset`), and `"Open in CPU Simulator"` CTA.
4. **CPU Simulator (`/simulator`):** Three-column desktop engineering workbench:
   - **Left Column (`320px`):** Preset Selector + `TIAN-ISA v1` Assembly Editor (line numbers, active `PC` indicator, inline syntax errors) + Execution Control Strip (`Run`, `Pause`, `Step Stage`, `Step Instr`, `Reset`, `Speed Slider`).
   - **Center Viewport (`1fr`):** Live 6-Stage Pipeline Ribbon (`FETCH`..`WRITE_BACK`) above synchronized 3D CPU Core / Data-Path Viewport showing live highlights and glowing signal packets.
   - **Right Column (`360px`):** Tabular Register File (`R0`–`R7` with changed-value flash, `PC`, `IR`, `MAR`, `MDR`), `FLAGS` (`Z, N, C, V`), Active ALU Operation Readout, Clock Cycle Counter, and live scrollable Data Memory Matrix (`MEM[0..255]`, filterable to non-zero/modified cells).
5. **Engineering Insights (`/insights`):** Left topic rail covering all 13 topics; main structured engineering reading column (`max-width: 72ch`) featuring architecture diagrams, formulas, real-world context, and interactive `"Inspect Components in 3D"` preview strip / deep-link buttons.
6. **Technical Library (`/library`):** Search bar + category tabs (`Component Encyclopedia`, `Engineering Glossary`, `Semiconductor Fundamentals`, `Architecture References`, `Technical Diagrams`, `Formulas & Equations`, `Learning Paths`), clean cross-linked index cards, and verified source citations.

---

## 5. Interactive States, Tooltips, Modals & Fallbacks

- **Hover Highlight & Tooltip:** Hovering over any 3D mesh smoothly boosts Fresnel/emissive cyan edge highlight (`#00E5FF`) and displays a compact cursor-anchored HUD tag (`Component Name` + `Group` + `Representation Type`). Zero delay (`<= 50 ms`).
- **Click-to-Inspect:** Clicking a mesh locks selection (`#00E5FF` border), glides camera to optimal framing if guided focus is enabled, and opens/updates the Right Inspector Drawer.
- **Loading States:**
  - 3D Canvas displays a geometric wireframe silicon die skeleton + progress percentage during `.glb` fetch.
  - Simulator displays `"Initializing Rust/WASM Engine..."` spinner in toolbar (`< 500 ms` typical) before enabling `Run`/`Step`.
- **Error States:**
  - Assembly syntax errors highlight exact line/column in crimson (`#EF4444`) with actionable correction hint (e.g., `"Unknown register 'R9'. Valid registers: R0–R7."`).
  - Runtime faults (`OUT_OF_BOUNDS_MEMORY`, `CYCLE_LIMIT_EXCEEDED`, `INVALID_OPCODE`) pause execution cleanly without crashing UI or WebGL context.
  - WebGL context loss renders a non-destructive recovery overlay + 2D schematic fallback so learning never halts.
- **Empty States:** When Data Memory filter `"Modified Only"` has no writes yet, display `"No memory writes yet — execute STORE to inspect live memory mutations."`
- **Modals:** Reserved strictly for Keyboard Shortcuts Help (`?`) and Program Preset / Export Assembly Dialogs; never interrupt component inspection with intrusive popups.

---

## 6. Responsive Behavior & Accessibility

### Breakpoints

- **Desktop Wide (`>= 1280px`):** Full 3-column workbench layouts (`Anatomy`, `Simulator`) with simultaneous 3D + editor + telemetry visibility.
- **Tablet / Compact Laptop (`768px – 1279px`):** Right Inspector / Telemetry converts into a slide-over drawer or tabbed bottom-right sheet while keeping the 3D viewport >= `55%` width.
- **Mobile (`< 768px`):** Stacked vertical layout — interactive 3D stage pinned to top `42vh` with touch-orbit gestures, tabbed control/inspector sheet below, horizontal scrollable 6-route nav bar.

### Accessibility (WCAG 2.1 AA)

- **Keyboard-First Parity:** Every 3D selectable component is equally selectable via keyboard (`Tab` / arrow keys) inside the `Chip Anatomy` tree; Space/Enter activates selection and triggers guided camera focus.
- **Simulator Shortcuts:** `Space` (Run/Pause when editor unfocused), `F10` / `Shift+S` (Step Stage), `Shift+R` (Reset), `Esc` (Clear component isolation / return to full view).
- **Reduced Motion (`prefers-reduced-motion: reduce` + HUD Toggle):** Disables idle rotation, ambient airflow particles, pulsing glow oscillations, and smooth camera glide animations (substituting crisp instant camera cuts and static directional path indicators).
