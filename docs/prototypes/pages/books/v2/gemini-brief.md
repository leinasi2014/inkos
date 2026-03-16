Here is the design specification for the `/books` route, strictly mapped to the InkOS unified visual foundation.

### 1. Page Role
The `/books` route serves as the production portfolio and command center for all novel projects. It replaces the traditional concept of a "digital bookshelf" with a tactical, high-density telemetry dashboard. The user arrives here to evaluate project health, track aggregate progress, and seamlessly dispatch into specific workspaces or AI-assisted chief contexts. 

### 2. Layout Recommendation
*   **Level 1: Global App Rail (Left):** 48px to 64px fixed width, pinning the `/books` icon in an active state (`text-primary` with a subtle `accent-primary` indicator line).
*   **Level 2: Contextual Sidebar:** Omitted for this root index page to maximize data density, unless used for project folders/tags (if implemented, max 240px wide).
*   **Level 3: Main Workspace (Center):** Fluid width, filling the remaining viewport. 
    *   *Top Bar:* 48px fixed height, containing the page title ("Books"), total project count (`text-secondary`), search/filter inputs, and a primary "New Project" action.
    *   *Scroll Region:* A vertically scrolling container housing the data table or tight grid, with independent `overflow-y: auto`. Max-width constraint is lifted here to allow horizontal data expansion, or capped at 1200px for ultrawide stability.

### 3. Content Hierarchy
The hierarchy prioritizes operational metadata over aesthetic cover art.
*   **Primary Identifier:** Book Title (`text-primary`, 14px, UI font, 600 weight) and internal Project ID/Codename (`text-secondary`, 12px, Monospace).
*   **Authoring Stage:** E.g., Worldbuilding, Outlining, Drafting, Revision. Represented by sharp-edged, minimal tags (`bg-muted`, 12px).
*   **Progress Metrics:** Exact word count, chapter count, and structural completion percentage. Displayed exclusively in JetBrains Mono / monospace to ensure tabular alignment.
*   **Telemetry & Risk:** Freshness (e.g., "Edited 2h ago") and AI Risk/Action status (e.g., "2 Pending Approvals", "Lore Conflict"). Warning states use `accent-warning` strictly applied to an indicator dot or the text itself.

### 4. Core Components
*   **The Index Table/List:** The primary view is a high-density data table.
    *   Rows are 40px to 48px high to maintain compact spacing.
    *   Rows are separated by a 1px `border-subtle` bottom border.
    *   Hovering a row shifts its background to `bg-accent` and darkens the text of secondary actions from `text-muted` to `text-primary`.
*   **Cover Art (If present):** Constrained to a minimal 32x48px sharp rectangle. Defaults to a monochrome wireframe or deeply muted background (`bg-surface`) with a 1px `border-default`. No drop shadows; hover states may introduce a slight opacity shift rather than a lift.
*   **AI Creation Tool Card (Modal/Inline):** When the user triggers "New Project via AI", the interface does not redirect. Instead, a standard InkOS Tool Card (1px `border-default`, monospace data preview) drops down in-layout or appears in a strict right-hand context panel to gather parameters (Genre, Premise) before scaffolding the project.

### 5. Button And Action Rules
*   **Global "New Book":** Placed in the top right of the workspace header. Primary button styling (4px radius, `bg-[accent-primary]`, white text, 28px or 32px height for tight UI).
*   **Row-Level Actions:** Critical actions ("Open IDE", "Consult Chief") are aligned to the right side of each table row.
    *   They must *not* be hidden behind a hover-only state, per anti-pattern rules. 
    *   They should be rendered as Ghost buttons (no border, `text-secondary`) resting, shifting to `bg-accent` and `text-primary` on row hover to reduce visual noise while remaining discoverable.
    *   A 3-dot (ellipsis) menu may only be used for destructive or rare actions (Delete, Duplicate, Export).

### 6. Light/Dark Notes
*   **Contrast Parity:** Ensure the `bg-accent` hover state on table rows has sufficient contrast against `bg-base` in both modes (`#F1F5F9` in Light, `#1E293B` in Dark).
*   **Monospace Data:** Warning and Success text colors (`accent-warning`, `accent-success`) must be checked against the background modes to ensure the telemetry data (like "Pending AI Action") remains highly legible without glowing unprofessionally.
*   **Borders:** The dense table relies entirely on `border-subtle` (`#E4E4E7` / `#27272A`). This ensures the structural grid feels like a cohesive instrument panel rather than floating elements.

### 7. Consistency Notes With Other Pages
*   **Grid Alignment:** The data columns here must align conceptually with the `/automation` task tables. Padding and typography styles (13px UI body, 12px monospace meta) are identical.
*   **Routing Hand-off:** A row click or primary row action should first enter the book-scoped hub (`/book-overview` for that project). From there, the user can branch into `/chapter-workbench`, `/truth`, `/materials`, or `/chief`. Do not bypass the book overview by sending every click straight into a chapter IDE, or the user loses the persistent book-level routing hand-off.
*   **Assistant Integration:** If a project has an active AI alert (e.g., the Assistant Chief has generated a new structural proposal), a small tool card indicator (status dot or `[!]` in monospace) appears next to the title, directly linking the user into the `/chief` context for that specific book.

### 8. Approval Verdict

APPROVED PAGE BRIEF
