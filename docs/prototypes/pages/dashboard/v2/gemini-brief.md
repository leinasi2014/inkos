### 1. Page Role
The `/` (Project Dashboard) route serves as the operational mission control for InkOS. It is a high-density, read-heavy overview designed for multi-book oversight. Its primary function is to surface actionable metrics—daily output, active book states, automated daemon statuses, and risk alerts—at a glance. It operates purely as a telemetry and navigation hub, explicitly avoiding conversational UI, deep authoring features, or the illusion that long-running workflows can be fully managed here.

### 2. Layout Recommendation
The layout adheres to a rigid, desktop-grade dashboard structure utilizing the foundation's dimensional rules:
*   **Level 1 (Left):** Global App Rail (48px fixed) containing primary routing.
*   **Level 3 (Center):** Main Workspace. Fluid width, structured as a strict grid. Contains the primary telemetry (Daily Output) and the Active Books data table. Manages its own vertical scroll (`overflow-y: auto`).
*   **Level 4 (Right):** Context/Meta Panel (320px fixed). Houses background process data: Daemon Summary, Recent Runs, and Risk Alerts. 
*   **Alignment:** No full-bleed background colors for content areas. Grid gutters are tight (16px), and internal component padding is compact (8px to 12px) to maximize information density without requiring window scrolling.

### 3. Content Hierarchy
The page is organized strictly by operational urgency and frequency of use:
1.  **Top Navigation/Header:** Minimal page title (`Title`: 20px, 600 weight) and global "New Project" action.
2.  **Aggregate Telemetry (Top Center):** A compact row of metric cards detailing Daily Output (word count deltas), active AI tasks, and overall system health.
3.  **Active Books (Center Main):** A dense data table or tight grid of active projects. Prioritizes metadata (current chapter, last edited timestamp, word count, current operational phase).
4.  **Risk Alerts (Top Right Panel):** High-priority notifications (e.g., plot inconsistencies detected by daemons, overdue tasks, failed material generations). 
5.  **Daemon Summary & Recent Runs (Bottom Right Panel):** A chronological, terminal-like feed of background AI activities and automated pipeline operations.

### 4. Core Components
*   **Telemetry Cards:** Rectangular blocks with 1px `border-default` and 4px border-radius. Uses `bg-surface`. Values (e.g., word counts) use JetBrains Mono or local monospace for tabular alignment. `text-secondary` is used for the metric label.
*   **Active Books Table:** 
    *   Rows separated by 1px `border-subtle`. 
    *   Book Titles use `text-primary` (UI font, 14px, 600 weight). No serif fonts are used here as this is an operational view, not deep reading.
    *   Hovering a row shifts the background to `bg-accent`.
*   **Daemon/Run Logs:** 
    *   Rendered within a `bg-muted` container holding a 1px `border-default`.
    *   Content strictly adheres to the Code/Data font (monospace, 12px) to signify machine-generated background operations.
*   **Alert Indicators:** System risks utilize austere visual markers rather than playful icons. A 4px sharp square or a 1px left-border highlight of `accent-warning` or `accent-destructive` indicates severity. 

### 5. Button And Action Rules
*   **Primary Actions:** The "Create Book" or "New Project" button uses solid `accent-primary` with a 4px border-radius and white text. It sits clearly in the top header area.
*   **Row-Level Actions:** Actions corresponding to Active Books (e.g., *Open, Settings, Archive*) must be visible at all times. They are rendered as Ghost buttons (`text-secondary` with no border), shifting to `text-primary` with `bg-accent` on hover. Hidden hover-discovery actions are strictly forbidden.
*   **Run Log Actions:** Restarting a failed daemon or viewing a tool card payload uses small, muted secondary buttons (transparent background, 1px `border-default`) attached to the log item.

### 6. Light/Dark Notes
*   **Surfaces:** The global background is `bg-base` (White or `#0D0D0D`). Telemetry cards and the right-hand level 4 panel sit on `bg-surface` (`#F4F4F5` or `#18181A`) to create subtle depth without relying on drop shadows.
*   **Typography:** Metadata timestamps and secondary statuses heavily utilize `text-secondary` to prevent visual fatigue, reserving `text-primary` purely for book names and critical data points.
*   **Statuses:** `accent-success` and `accent-warning` must maintain strict contrast ratios against `bg-base` and `bg-surface`. Avoid tinting the entire row background with a status color; use typography or strict 1px borders instead.

### 7. Consistency Notes With Other Pages
*   **Versus `/chief`:** Unlike the Chief interface, which is center-aligned and thread-based with a max-width, the Dashboard utilizes fluid grid space and avoids conversational UI entirely. 
*   **Versus `/books`:** This dashboard curates only *active* books and operational data. The `/books` route will expand upon the table component designed here to include sorting, filtering, and archived projects.
*   **Tool Card Synergy:** If a daemon run fails or requires manual intervention, the dashboard may expose a lightweight inspector summary or a route into `/automation`, but it should not become a second automation center by embedding full job payload management inline.

### 8. Approval Verdict

APPROVED PAGE BRIEF
