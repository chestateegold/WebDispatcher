
# Frontend Summary – Browser-Based CTC Panel (Model Railroad)

## High-Level Goal

Build a **touch-enabled, browser-based CTC-style dispatcher panel** for a model railroad, running locally on a **Raspberry Pi**.

The UI displays and controls:
- Track blocks
- Turnouts (switches)
- Signals

It reflects real-time hardware state (CMRI) with **smooth visual feedback** and **deterministic layout**.

The frontend is intentionally:
- Lightweight
- Deterministic
- Appliance-like
- Offline-capable

---

## Deployment & Runtime Environment (Frontend-Relevant)

- **Hardware:** Raspberry Pi 4 (2 GB RAM)
- **OS:** Raspberry Pi OS Lite (headless)
- **Display:** Touchscreen (HDMI or official Pi display)
- **Browser:** Chromium in fullscreen / kiosk mode
- **Desktop Environment:** None

> “Headless” here means *no desktop shell*, **not** no graphics.
> A minimal X server is used solely to host Chromium.

Only one page is loaded (`http://localhost`).
No tabs, no extensions, no dev tools.

---

## UI Architecture (Core Decisions)

- **HTML + CSS + SVG only**
- No frameworks required
- SVG is used for **track geometry**
- CSS classes control **state and animation**

Why:
- SVG is precise and scalable
- CSS transitions are cheap and GPU-accelerated
- Works well on low-power hardware
- Ideal for schematic diagrams

---

## Layout System

This is **not a responsive website**.

The UI represents a **physical dispatcher panel** with fixed proportions.

### Key Rules

- **CSS Grid** with fixed pixel dimensions
- No `vw`, `vh`, or `fr` units for track geometry
- Containers size to content (`width: fit-content`)
- Screen size must not distort component proportions

Example concept:

```css
grid-template-columns: repeat(N, 80px);
grid-template-rows: repeat(M, 60px);
gap: 1–2px;
```

---

## Core Visual Components

### 1. Straight Track Block

- Fixed-size grid cell
- SVG line runs almost edge-to-edge
- Occupancy indicated by stroke color
  - Gray = unoccupied
  - Red = occupied
- Smooth CSS color transitions

---

### 2. Signal (3-Aspect)

- Vertical stack of lamps:
  - Red
  - Yellow
  - Green
- One lamp active at a time

**Interaction model:**
- Tap / click the **signal itself** to cycle aspect
- No separate control buttons

---

### 3. Turnout (Switch)

- One grid cell with SVG geometry
- Shows:
  - Straight mainline
  - Diverging curved route
- Two states:
  - Normal
  - Thrown
- Active route highlighted, inactive route dimmed

---

## Grid Continuity & Track Appearance

- Grid gap reduced to **1–2px**
- SVG rails extend nearly to cell edges
- Increased rail stroke width

---

## Animation Philosophy

- **State-driven**, not time-driven
- No polling loops
- No animation timers
- All visuals react only to state changes

---

## Event Model (Frontend Perspective)

### Current (POC)
- User clicks trigger local state changes

### Final Design
- Backend pushes updates via SignalR / WebSockets
- UI subscribes to events:
  - BlockStatusChanged
  - SignalAspectChanged
  - TurnoutPositionChanged
  - LogMessage

---

## Why a Browser UI

- Native touch support
- SVG + CSS ideal for schematics
- Chromium kiosk mode is stable and fast
- UI can restart without stopping hardware control
- Multiple clients possible later

---

## Explicit Non-Goals

- No WebGL
- No canvas rendering
- No 3D graphics
- No responsive website behavior
- No cloud or internet dependency
- No full desktop environment

---

## Current State

- Working HTML proof of concept
- Fixed-geometry CSS Grid layout
- Straight track, signal, and turnout components
- Touch interaction validated
- Ready for real-time backend integration

---

## Mental Model

> This is a **fixed-geometry, browser-rendered CTC control panel**, using SVG and CSS for deterministic layout and animation, designed to be driven by **real-time backend state updates**, not polling.
