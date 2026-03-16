### 1. Page Role
The `/settings` route serves as the global control surface for InkOS. Its primary function is the precise configuration of the IDE’s operational parameters: AI model routing (e.g., assigning specific LLMs to drafting vs. structuring), system notifications, application-wide project defaults, and the enablement of experimental or advanced capabilities. It acts as a rigid, text-heavy dashboard built for system administrators and power-user authors.

### 2. Layout Recommendation
*   **Structure:** Adheres strictly to the Level 1 (Global App Rail) and Level 2 (Contextual Sidebar) foundation. The L2 sidebar hosts the settings navigation (e.g., "General", "Model Routing", "Workspaces", "Advanced").
*   **Workspace (Level 3):** The main configuration area features a strict left-aligned layout bounded by a maximum width of 800px to ensure horizontal scanning remains comfortable on ultrawide displays. 
*   **Scroll Behavior:** The L2 sidebar and the Level 3 800px form column scroll independently (`overflow-y: auto`). The application window itself never scrolls.
*   **Spacing:** High density. Sections are separated by 24px margins, but internal form elements (labels to inputs) use tight 4px or 8px padding.

### 3. Content Hierarchy
*   **Page Header:** Uses the `Title` typography (20px, 600 weight). A 1px `border-subtle` sits directly beneath the header area to anchor the scrolling form below.
*   **Section Categories:** Groupings within a page (e.g., "API Keys" under "Model Routing") use the `Heading` typography (14px, 600 weight) accompanied by a short `text-secondary` helper description natively breaking to the next line.
*   **Form Labels:** Rendered in `Meta` (12px, 500 weight, all caps permitted for strict labeling) or `Body (UI)` (13px, 400 weight).
*   **Data/Read-Only Values:** Local file paths, system IDs, or API key masks must be rendered in the Code/Data JetBrains Mono font over a `bg-muted` background to denote non-editable system truth.

### 4. Core Components
*   **Form Inputs & Selects:** Strict 4px border-radius with a 1px `border-default`. Focus states must trigger the 2px `accent-primary` outline with a 1px offset. Backgrounds for inputs remain `bg-base` to sharply contrast with the `border-default`.
*   **Segment Controls:** Because standard pill-shaped toggle switches are forbidden, binary settings (e.g., Enable/Disable telemetry) use tight, sharp-cornered segment controls or standard checkboxes with 4px border-radii. 
*   **Key-Value Tables:** Used for managing project defaults and API keys. Rows have a 1px `border-subtle` bottom border. Hovering a row triggers `bg-accent` to reveal contextual actions (e.g., an "Edit" or "Revoke" button).
*   **Status Indicators:** AI capability and API routing connection states use the approved `accent-success`, `accent-warning`, or `accent-destructive` colors, visualized as 6px x 6px square indicators (or minimal status dots, the only permitted use of full rounding) next to the `Meta` label.

### 5. Button And Action Rules
*   **Placement:** Global "Save Changes" or "Apply" buttons belong in a fixed top-right action bar within the L3 workspace header, or pinned to the bottom of the form to ensure they never scroll out of view.
*   **Primary Actions:** System-wide applies use the solid `accent-primary` background with a 4px radius. 
*   **Destructive Actions:** "Reset to Defaults" or "Clear Cache" buttons must use the `accent-destructive` scheme and are relegated to the bottom of their respective sections, requiring explicit intent (no hidden hovers).
*   **Validation Tool Cards:** If an API key is entered, an inline Tool Card (e.g., `[Tool: Ping Model Server]`) may append below the input, using monospace payloads and `bg-muted` to output the raw connection test results before the user saves.

### 6. Light/Dark Notes
*   **Backgrounds:** The main settings container utilizes `bg-base` (White or `#0D0D0D`). Settings segments or grouped capability cards can utilize `bg-surface` (`#F4F4F5` or `#18181A`) to lift them slightly off the background without relying on drop shadows.
*   **Borders & Disabled States:** Heavy reliance on `border-default` (`#D4D4D8` / `#3F3F46`) to separate form fields. Disabled toggles or unconnected services drop completely to `text-muted` and `bg-muted` (`#E4E4E7` / `#27272A`), relying purely on contrast reduction to signify inactivity. 

### 7. Consistency Notes With Other Pages
*   **Shared Topology:** The L2 settings navigation behaves identically to the chapter tree found in `/books/:bookId/chapters/:chapterNo`. 
*   **Form Parity:** The data-entry format mirrors the left-pane material generation form on the `/books/:bookId/materials` route. Both utilize the 800px max-width, rigid segmentation, and tight input padding.
*   **No Read/Write Bifurcation:** Unlike the `/books` reading views that utilize the high-legibility Serif font, `/settings` is entirely operational. Only the UI system font and Code/Data monospace fonts are permitted here.

### 8. Approval Verdict
APPROVED PAGE BRIEF