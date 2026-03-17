### 1. Page Role
The `/books/:bookId` route serves as the operational command center for a single book project. It is not an authoring environment, but rather a tactical telemetry dashboard. It answers immediate project-management questions: *What is the current state of the manuscript?*, *What AI tasks are pending resolution?*, and *What is the immediate next logical action?* It acts as the routing hub to the deep-focus areas (Chapters, Truth, Materials).

### 2. Layout Recommendation
This page utilizes the application's robust multi-pane desktop layout to maintain spatial stability:
*   **Global App Rail (Left):** 48px to 64px width, persistent.
*   **Book Contextual Sidebar (Left-Middle):** 240px width, sticky. Contains the navigation for this specific book: Overview (active), Chapters list, Truth base, Materials repository, and Settings.
*   **Main Workspace (Center/Right):** Fluid width, with an internal vertical scroll (`overflow-y: auto`). The content within this pane should use a strict max-width (e.g., 960px) and center alignment, or a rigid CSS grid, to prevent horizontal sprawling on ultrawide monitors.
*   **Grid Structure:** Inside the main workspace, use a 2-column or 3-column asymmetric grid (e.g., `grid-cols-12` where the main feed takes 8 columns and health/meta takes 4 columns) with a tight 16px or 24px gap.

### 3. Content Hierarchy
The information architecture flows from high-level status down to granular, actionable components:
*   **Page Header:** 
    *   `Title` (20px, 600 weight).
    *   `Meta` data row (monospace preferred): Total word count, global completion percentage, current semantic stage (e.g., `STAGE: OUTLINING`, `STAGE: DRAFTING`), and last modified timestamp.
*   **Hero Action / Next Recommended Step:** A prominent, full-width block directly below the header. Driven by the AI Chief, this surfaces the most critical blocker or next step (e.g., "Resume Chapter 4", "Review 3 Pending Material Generations", or "Resolve Truth Conflict in Character Profiles").
*   **Activity & Chapters Feed (Main Column):** A dense, chronological tabular list of recent chapter modifications, branching, or status changes. 
*   **Telemetry & Health (Side Column):** 
    *   **Truth Health:** Number of established entities, missing relationships, or orphaned data points.
    *   **Materials Status:** Unused research, pending tool approvals.

### 4. Core Components
*   **Status/Telemetry Cards:** Flat bordered boxes (1px `border-default`, 4px radius) with an optional `bg-surface` fill. Padding is tight (12px). Data points inside use `text-secondary` for labels and `text-primary` JetBrains Mono for the actual metrics.
*   **Dense Data Tables:** The recent chapters feed should be a strict list. No alternating row backgrounds. Use a 1px `border-subtle` bottom border for rows. Columns: Chapter ID (monospace), Title, Status (Draft, Revised, Final), Word Count (monospace), Last Edited.
*   **AI Recommendation Block (Tool Card format):** The "Next Recommended Action" should mimic the assistant UI's Tool Card. It features a muted header row `[System: Next Logical Action]` and an action bar at the bottom containing the primary action button to execute the recommendation.
*   **Progress Visualization:** Avoid circular/gauge charts. Use purely horizontal, 4px-tall linear progress bars mapped to a muted track (`bg-muted`) and a primary fill (`accent-primary`).

### 5. Button And Action Rules
*   **Primary Action:** Only one `accent-primary` button should exist on this page, tied to the "Next Recommended Step" (e.g., a solid blue `[ Resume Draft ]` or `[ Review Pending ]` button).
*   **Secondary Actions:** Links to specific chapters or truth documents within the tables should use `text-primary` on hover, with no background changes.
*   **Action Visibility:** "Edit Book Settings" or "Export" buttons shouldn't be hidden behind a meatball (three-dot) menu. Place them as small, ghost buttons (`text-secondary`, 4px radius) in the top-right of the page header. 
*   **Tool Executions:** Any action that triggers an AI generation from this page must instantly swap the button state to a monospace `[ RUNNING... ]` tag with `bg-muted` and `border-strong` to prevent double-clicks.

### 6. Light/Dark Notes
*   **Neutral Emphasis:** The dashboard should look predominantly gray/monochrome in both modes. Use `bg-surface` against `bg-base` to subtly lift the Telemetry cards.
*   **Semantic Alerts:** If the Truth or Materials health is poor (e.g., conflicting character lore detected), use a 1px border of `accent-warning` on the specific card and a `text-primary` to `text-secondary` hierarchy inside. Do not flood the background with the warning color; rely on the border and icon.

### 7. Consistency Notes With Other Pages
*   **Transition to IDE:** Clicking "Resume" or opening a chapter must feel seamless. The Book Contextual Sidebar remains perfectly static, while the Main Workspace swaps from this dashboard view to the 3-pane IDE layout of `/books/:bookId/chapters/:chapterNo`. This zero-layout-shift routing is critical for the "desktop tool" feel.
*   **Data Representation:** The way a chapter is listed in the dashboard's Activity Feed must use the exact same typographic hierarchy and metadata tags (e.g., `text-secondary` for word count, monospace for `.ch` identifiers) as the global `/books` index.
*   **Tool Cards:** The "Next Recommended Step" block borrows its exact CSS classes from the Tool Cards used in the `/chief` and `/books/:bookId/materials` routes, standardizing how the system prompts the user.

### 8. Approval Verdict

APPROVED PAGE BRIEF