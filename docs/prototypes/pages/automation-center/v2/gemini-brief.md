### 1. Page Role
The `/automation` route serves as the operational command center for InkOS. Its primary role is to expose the inner workings of background tasks, AI daemon health, task queues, and automated material generation. It is entirely detached from the authoring and reading experience. This is a purely administrative, terminal-adjacent ops panel designed for diagnosing failures, managing throughput, and configuring recurring triggers. 

### 2. Layout Recommendation
Following the foundation rules for administrative pages, `/automation` will utilize a fixed-viewport architecture with internal scrolling regions.
*   **Level 1 (Left):** Global App Rail (48px–64px).
*   **Level 3 (Center):** Main Workspace. Content must adhere to a left-aligned container with a `max-width` of 800px.
*   **Page Rhythm:** The layout should heavily utilize horizontal spanning rows and data tables with tight cell padding (8px) and a rigid vertical rhythm (12px or 16px gaps between major sections). The 800px column provides a focused, single-column reading flow for complex operational data, avoiding the eye-strain of full-bleed widescreen tables.

### 3. Content Hierarchy
1.  **Header & Daemon Status:** 
    *   `Title` typography ("Automation Control").
    *   A dense top-bar displaying global metrics using monospace values: Daemon Uptime, Memory/Token Usage, and Active Workers. 
    *   A global toggle or primary button for "Suspend All Daemons" / "Start Daemons".
2.  **Segmented Navigation:** A strict, non-pill segment control switching between *Active Queue*, *Schedules*, and *Job History*.
3.  **Active Queue (Data Table):** 
    *   A high-density list of running and pending jobs.
    *   Columns: Job ID (Monospace), Target (Book/Chapter), Task Type (e.g., `Generate Material`, `Bulk Rewrite`), Status/Progress, and Actions.
4.  **Log Viewer / Details (Inspector or Dedicated Detail Pane):** Upon clicking a row, the selected job's payload, stdout, or error summary should appear in the right-side inspector or a dedicated detail pane. Do not expand long logs inline inside the table, or the queue becomes hard to scan.

### 4. Core Components
*   **Status Indicators:** Small, perfectly square (or max 4px radius) badges indicating state. 
    *   *Running:* `accent-primary` text/border.
    *   *Queued:* `text-secondary` and `bg-muted`.
    *   *Failed:* `accent-destructive` text/border.
    *   *Completed:* `accent-success` text/border.
*   **Ops Data Tables:** Rows separated by 1px `border-subtle`. Hover states trigger `bg-accent` to help the user track horizontal data across the 800px width.
*   **Tool Cards for Job Payloads:** When a background job involves an AI tool call (e.g., `[Tool: Batch Outline]`), the job detail expands into the standard Tool Card UI. This uses a 1px `border-default`, `bg-muted` for the JSON payload/parameters, and an action bar at the bottom (`[ Retry ] [ Cancel ]`) rendered as ghost or secondary buttons.
*   **Log Console:** An embedded `<pre>` container using `bg-surface`, 1px `border-default`, and `<code class="text-secondary">` with JetBrains Mono. Scrollable independently on the Y-axis.

### 5. Button And Action Rules
*   **Visibility:** ALL row-level actions (Pause, Retry, Cancel, Delete Job) must be visibly docked to the right side of the row. **No hidden actions requiring hover discovery.**
*   **Form Factor:** Use Ghost buttons (`text-secondary` with no border, matching `bg-accent` on hover) for row actions to prevent visual clutter in dense lists.
*   **Destructive Actions:** "Cancel" or "Delete" actions must turn `accent-destructive` on hover or focus to clearly warn the user.
*   **Global overrides:** "Kill Daemons" or "Clear Queue" should be explicitly separated visually (e.g., placed at the top or bottom of the view alongside the header) and utilize the `border-default` with `accent-destructive` text.

### 6. Light/Dark Notes
*   **Consistency in Contrast:** Ensure that status colors (`accent-warning`, `accent-destructive`, `accent-success`) have sufficient contrast against both `bg-base` (Light: `#FFFFFF`, Dark: `#0D0D0D`) and `bg-surface` (Light: `#F4F4F5`, Dark: `#18181A`).
*   **Log Readability:** The monospace log viewer should rely on `text-secondary` (Light: `#52525B`, Dark: `#A1A1AA`) to prevent the starkness of pure black or pure white text from dominating the screen, except where `accent-destructive` is required for error traces.
*   **Borders over Shadows:** The depth of the expanded inline Tool Cards or Log Viewers is achieved purely through 1px `border-strong` lines, not shadows, ensuring the ops panel feels rigidly flat in both themes.

### 7. Consistency Notes With Other Pages
*   **Alignment with `/settings`:** Shares the exact identical left-aligned, 800px max-width container format.
*   **Cross-linking:** Job targets should provide a direct route into the relevant book-scoped page (`/materials`, `/truth`, `/chapter-workbench`, or `/book-overview`) from the selected job detail. The queue stays scan-friendly while deep inspection happens in the dedicated destination page.
*   **Typography overlap:** Utilizes the exact same monospace treatment for "Job IDs" as the "Entity IDs" found in the `/books/:bookId/truth` section. Serif fonts are strictly forbidden on this page.

### 8. Approval Verdict

APPROVED PAGE BRIEF
