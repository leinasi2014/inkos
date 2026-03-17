### 1. Page Role
The `/chief` route acts as the core orchestration center of InkOS. It is the primary AI workspace where the user interacts with the system as a "Chief Editor." Here, the user directs overarching goals, reviews AI-generated plans, evaluates candidate materials, and approves or rejects structured outputs. It is an operational command center, not a casual chat interface.

### 2. Layout Recommendation
*   **Global Positioning:** Occupies the Level 3 Main Workspace, immediately to the right of the Level 1 Global App Rail.
*   **Container Proportions:** The layout is a full-height, fixed-viewport flex column. The central content area strictly enforces a maximum width of 800px to ensure horizontal scanning remains comfortable and tightly packed, centered within the available fluid width.
*   **Scrolling Regions:** The thread stream area takes up `flex-grow: 1` and manages its own vertical overflow (`overflow-y: auto`). The application window itself never scrolls.
*   **Docked Area:** The input composer is permanently docked to the bottom of the screen, decoupled from the scrolling thread above it.

### 3. Content Hierarchy
1.  **Header (Optional/Minimal):** A sticky top rail (max-width 800px) displaying the current context ("Chief Editor") and system status (e.g., "Idle", "Generating..."), bordered at the bottom by `border-subtle`.
2.  **The Thread (Stream):** A chronological stack of operations. This includes user directives, AI responses, system logs, generating states, and interactive Tool Cards. 
3.  **Command Bar (Composer):** The bottom-anchored input area. Takes precedence at the bottom of the viewport, styled like a robust terminal prompt rather than a consumer messaging field.

### 4. Core Components
*   **Message Blocks:** No speech bubbles. User and AI messages are flat, full-width blocks separated by horizontal `border-subtle` lines. 
    *   *User Directives:* Prefixed with a strict `>` or `<` indicator, colored `text-secondary`, indented 16px to distinguish from system outputs.
    *   *AI Responses:* Flush left, utilizing the UI font (`text-primary`), rendering Markdown structurally without whimsical styling.
*   **Plan Cards:** Rendered as structured items in the thread. A plan is enclosed in a 1px `border-default` box, with sub-tasks listed as dense checkboxes, utilizing `bg-muted` for pending states and `accent-success` for completed step indicators.
*   **Tool Cards (Approvals/Candidates):** When the AI proposes material or code, it appears within an inline card (`border-default`). The card header has a muted background (`bg-surface`) with monospace text indicating the tool (e.g., `[Tool: Submit_Revision]`). The interior payload strictly uses JetBrains Mono for data representation or diffs.
*   **Docked Composer:** A boxy textarea with a strict 1px `border-default` and 4px border-radius. When focused, it receives a 2px `accent-primary` outline (1px offset). Includes discrete, icon-level action toggles (like "Attach Context") inside the border.

### 5. Button And Action Rules
*   **Tool Card Action Bars:** At the bottom of every tool card, actions span the full width in a segmented, densely packed row `[ Apply ] [ Edit ] [ Reject ]`. 
    *   Current pending actions utilize solid `accent-primary` or `accent-success` with sharp 4px radii. 
    *   Dangerous rejections use `accent-destructive`.
*   **Visibility:** Critical trajectory operations (Apply, Reject, Edit) are never hidden behind hover states. They are statically rendered to ensure confident, rapid-fire mouse or keyboard targeting.
*   **Composer Submission:** No standalone circular "send" button. A flat, robust `[ Submit ]` button sits inside or immediately adjacent to the composer, heavily favoring `Cmd+Enter` desktop keyboard shortcuts for execution.

### 6. Light/Dark Notes
*   **Depth flatlining:** The thread background relies entirely on `bg-base` (White or `#0D0D0D`). Contrast for Tool Cards is created exclusively via `border-default` (`#D4D4D8` / `#3F3F46`) and a subtle shift to `bg-surface` (`#F4F4F5` / `#18181A`) for card headers. 
*   **Separators:** The `border-subtle` lines dividing messages must remain barely perceptible yet structurally grounding (`#E4E4E7` in Light, `#27272A` in Dark). 
*   **AI Working States:** When the AI is actively generating, the appending block pulses smoothly between `bg-base` and `bg-muted`—avoiding bright loading spinners in favor of structural background shifts.

### 7. Consistency Notes With Other Pages
*   **Composer Convention:** The terminal-like, boxy docked input established here dictates how contextual AI sidebars will look on the `/books/:bookId/chapters/:chapterNo` route. 
*   **Component Reuse:** The Tool Cards (used here for broad approvals) are the exact same component architecture utilized in `/books/:bookId/materials` for split-pane previews.
*   **Layout Contrast:** While `/books` heavily features tight grids and tables taking full width, `/chief` restricts its core reading axis to 800px width. Both, however, adhere strictly to the no-window-scroll, fixed-pane architecture.

### 8. Approval Verdict
APPROVED PAGE BRIEF