Here is the unified visual foundation specification for InkOS. This spec solidifies the tactical-precision direction, establishing a rigorous, desktop-grade environment tailored for professional authoring and AI-assisted workflow control.

### 1. Design Direction
**Tactical Precision & Desktop Tooling**
InkOS is an IDE for novel production. The UI must be invisible, stepping back to let the text and the AI workflow take center stage. 
*   **Structure over styling:** Containment is achieved through 1px borders, subtle background shifts, and rigid grid alignment, not heavy drop shadows or large gutters.
*   **Compact & Dense:** Information density should be high, comfortable for a desktop monitor setup. Components should use tight padding (e.g., 4px, 8px, 12px) rather than consumer-app spacing (e.g., 16px, 24px).
*   **Restrained Geometry:** Keep border radii tight (0px to 4px max). Sharp corners signify a tool; heavy rounding signifies a toy. 

### 2. Theme Tokens
A semantic token system for strict Light and Dark mode parity. The palette relies on neutral grays with a single, austere blue for focus and action.

**Backgrounds**
*   `bg-base`: Core app background. (Light: `#FFFFFF`, Dark: `#0D0D0D`)
*   `bg-surface`: Secondary panels, sidebars, tool cards. (Light: `#F4F4F5`, Dark: `#18181A`)
*   `bg-muted`: Blockquotes, disabled states, AI working states. (Light: `#E4E4E7`, Dark: `#27272A`)
*   `bg-accent`: Hover states on rows/menus. (Light: `#F1F5F9`, Dark: `#1E293B`)

**Borders**
*   `border-subtle`: Dividers between list items. (Light: `#E4E4E7`, Dark: `#27272A`)
*   `border-default`: Cards, inputs, pane dividers. (Light: `#D4D4D8`, Dark: `#3F3F46`)
*   `border-strong`: Active focus, drag edges. (Light: `#A1A1AA`, Dark: `#52525B`)

**Typography**
*   `text-primary`: Main reading text, headings. (Light: `#09090B`, Dark: `#FAFAFA`)
*   `text-secondary`: UI labels, timestamps, metadata. (Light: `#52525B`, Dark: `#A1A1AA`)
*   `text-muted`: Placeholder, disabled text. (Light: `#A1A1AA`, Dark: `#52525B`)

**Functional Accents**
*   `accent-primary`: The only brand color. Used for primary buttons, focus rings, selected tabs. (Light: `#0055FF`, Dark: `#3B82F6`)
*   `accent-destructive`: Deletions, severe errors. (Light: `#DC2626`, Dark: `#EF4444`)
*   `accent-success`: Approvals, success states, diff additions. (Light: `#16A34A`, Dark: `#22C55E`)
*   `accent-warning`: Unsaved changes, pending AI actions. (Light: `#D97706`, Dark: `#F59E0B`)

### 3. Typography System
Two contrasting typographical contexts are required: *UI Operation* and *Deep Reading*.

*   **Font Family (UI):** System fonts for zero-latency rendering (Inter, SF Pro, Segoe UI).
*   **Font Family (Reading):** A high-legibility serif (e.g., Georgia Pro, Charter, or a premium web serif like Source Serif Pro) restricted exclusively to chapter content and truth documents.
*   **Font Family (Code/Data):** JetBrains Mono or local monospace for IDs, JSON outputs, and raw material data.

**Hierarchy**
*   `Title`: 20px, 600 weight, UI font. Used for page headers.
*   `Heading`: 14px, 600 weight, UI font. Used for panel headers and tool card titles.
*   `Body (UI)`: 13px, 400 weight, 1.4 line-height, UI font. Standard UI text.
*   `Body (Reading)`: 16px/18px, 400 weight, 1.6 line-height, Serif font. Max-width of 65 characters for optimal reading comfort.
*   `Meta`: 12px, 500 weight, UI font. All caps allowed for small eyebrow labels.

### 4. Layout System
A rigid, fixed-viewport framework with internal scrolling regions. The user should never scroll the entire browser window.

*   **Level 1: Global App Rail (Left):** 48px to 64px wide. Contains primary routing (`/chief`, `/books`, `/automation`, `/settings`). Fixed position.
*   **Level 2: Contextual Sidebar:** 240px to 280px wide. Contains secondary navigation (e.g., chapter lists for a book, materials list). Collapsible.
*   **Level 3: Main Workspace (Center):** Fluid width. 
*   **Level 4: Context/Meta Panel (Right, Optional):** 300px wide. Used for inline details, AI assistant flyouts, or property editors.

**Scroll Regions:** Each horizontal pane manages its own vertical overflow (`overflow-y: auto`). 

### 5. Core Component Rules
*   **Buttons:** Strict 4px border-radius. 
    *   *Primary:* Solid `accent-primary` background, white text.
    *   *Secondary:* Transparent background, `border-default`, `text-primary`.
    *   *Ghost:* No border, `text-secondary`, shows `bg-accent` on hover.
*   **Inputs:** 4px border-radius, 1px `border-default`. Focus state uses a 2px outline of `accent-primary` with a 1px offset.
*   **Assistant UI (Threads & Chat):** 
    *   *No speech bubbles.* Messages are flat blocks separated by horizontal rules (`border-subtle`).
    *   *User messages:* Indented slightly or marked with a simple `<` indicator, `text-secondary`.
    *   *AI messages:* Left-aligned, markdown-rendered, `text-primary`.
*   **Tool Cards (Approvals & Structured Results):**
    *   Rendered as inline cards with a 1px `border-default` and a muted header row indicating the tool's name (e.g., `[Tool: Generate Material]`).
    *   Bottom of the card contains an action bar spanning the full width: `[ Apply ] [ Edit ] [ Cancel ]`.
    *   Data payloads (diffs, JSON) inside tool cards must use monospace and `bg-muted`.

### 6. Per-Page Consistency Rules
*   **`/chief`**: A full-height, center-aligned thread environment. Max-width of 800px for the message stream. The input area is a docked command bar at the bottom, resembling a terminal prompt more than a messaging app.
*   **`/books`**: High-density data table or tight grid. Cover art (if any) is minimal/monochrome until hovered. Focus is on metadata: word count, last edited, status.
*   **`/books/:bookId/chapters/:chapterNo`**: Standard 3-pane IDE layout. Left: Chapter tree. Center: Reading/Writing area with Serif font. Right: Optional contextual AI/Truth panel.
*   **`/books/:bookId/truth`**: Structured key-value pairs and entity relationships. Visually distinct from prose; relies heavily on cards and monospace data tags.
*   **`/books/:bookId/materials`**: Split-pane workflow. Left: Material generation form. Right: Live preview of the structured result card, awaiting the "Apply" or "Regenerate" approval action.
*   **`/automation` & `/settings`**: Standard form/table layouts adhering to a max-width of 800px, left-aligned, utilizing structured segment controls.

### 7. Anti-Patterns To Avoid
*   **NO pill-shaped buttons.** (e.g., `rounded-full` is forbidden except for avatars/status dots).
*   **NO chat bubbles with tails or aggressive backgrounds.** Do not make it look like iMessage.
*   **NO playful gradients.** Solid colors only.
*   **NO massive drop shadows.** Elevation is denoted by `border-default` and `bg-surface`, not blurs.
*   **NO full-bleed background colors for content areas.** The center column should always feel like an integrated part of the desktop application, not a standalone marketing page.
*   **NO hidden contextual actions that require hover discovery.** If an action is critical (e.g., Edit, Delete, Apply), it must be visible at all times, potentially muted until hovered, but never missing from the layout.

### 8. Approval Verdict

APPROVED FOUNDATION