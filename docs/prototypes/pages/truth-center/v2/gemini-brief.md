### 1. Page Role
The `/books/:bookId/truth` route serves as the authoritative database for the novel's universe. It is the single source of truth for characters, locations, lore, rules, and timelines. Unlike chapter prose, this page treats narrative elements as strict, structured data. It acts as the critical reference point for the AI assistant to maintain continuity and for the author to manually audit the world's state at any given chapter.

### 2. Layout Recommendation
This route strictly adheres to the IDE layout framework, utilizing a rigid, fixed-viewport 3-pane (or 4-pane) structure to manage high-density data without window scrolling.

*   **Level 1: Global App Rail (Fixed Left):** Standard 48px–64px rail containing top-level navigation.
*   **Level 2: Contextual Sidebar (Left, 240px–280px):** Must preserve the book-level navigation at the top (Overview / Chapters / Truth / Materials), then dedicate the remaining vertical space to the Truth Index. The page-specific file list or category tree lives beneath that book navigation block rather than replacing it outright.
*   **Level 3: Main Workspace (Center, Fluid Width):** The primary viewing and editing zone for the selected Truth Entity. Max-width of 800px applied to the internal content container to maintain reading comfort, centered within the pane.
*   **Level 4: Context/Meta Panel (Right, 300px):** Dedicated to AI operations and history. This pane displays the entity's change history (e.g., state changes across chapters) and houses the Assistant UI for extracting or updating truth directly from prose.

### 3. Content Hierarchy
The main workspace (Level 3) follows a strict top-to-bottom structural flow, prioritizing data clarity over narrative flow.

1.  **Entity Header:** 
    *   Title in `Title` (20px, 600 weight, UI font).
    *   Eyebrow label (e.g., `CHARACTER | ID: CHR-001`) using `Meta` (12px, uppercase, UI font).
2.  **Properties Grid (Key-Value Pairs):** 
    *   Tabular or CSS-grid layout with 1px `border-subtle` horizontal dividers. 
    *   Keys (e.g., "Aliases", "Current Location") in `text-secondary`.
    *   Values containing pure data in JetBrains Mono.
3.  **Structured Facts (The "Truth"):**
    *   Rendered as data-first rows, cards, or key-value blocks. Avoid falling back to a prose-reading shell for the primary document view; truth files should read like structured state, not chapter text.
4.  **Relationships & References:**
    *   A dense cluster of cross-linked entities (e.g., "Allies", "Contained Within") represented as monospace data tags.

### 4. Core Components
*   **Truth Cards:** Used to encapsulate distinct pieces of lore. 1px `border-default`, `bg-surface`, strict 4px border-radius. Padding is tight (12px).
*   **Data Tags:** Inline entity references use `bg-muted` with `border-default` (1px) and `text-secondary` JetBrains Mono typography. No pills; corners are 2px or 4px radius.
*   **Tool Cards (Truth Extraction/Update):** When the AI suggests an update to the Truth based on a recent chapter, it renders a Tool Card in the Level 4 panel. 
    *   Includes a `bg-muted` header (`[Tool: Propose Truth Update]`).
    *   Displays before/after states using inline diffs (`accent-success` background for additions, `accent-destructive` text/strikethrough for removals).
    *   Payload uses JetBrains Mono.
*   **Chapter Continuity Timeline:** A vertical stepper component in the Level 4 panel using minimal geometry (1px vertical line in `border-subtle`, 6px square nodes). Tracks how an entity's state changes chronologically.

### 5. Button And Action Rules
*   **Entity Creation:** A primary button (`accent-primary` background, white text, 4px radius) pinned to the top or bottom of the Level 2 Truth Index for generating new entries.
*   **Inline Actions:** "Edit", "Delete", and "View History" actions on Truth Cards must be perpetually visible as `text-secondary` or `text-muted` ghost buttons (transparent background). They may intensify to `text-primary` with `bg-accent` on hover, but must never be hidden behind a hover-only state or an overflow ellipsis unless horizontal space critically demands it.
*   **Approval Action Bar:** AI-generated truth updates presented in Tool Cards must feature a full-width bottom action bar spanning the card: `[ Apply ] [ Edit ] [ Reject ]`. `Apply` takes `text-primary` and `border-default`, while `Reject` takes `text-muted`.

### 6. Light/Dark Notes
*   **Background Shifts:** The distinction between Level 2/4 sidebars and the Level 3 Main Workspace is achieved strictly via alternating `bg-surface` (`#F4F4F5` / `#18181A`) and `bg-base` (`#FFFFFF` / `#0D0D0D`). No drop shadows are used to separate panes; only 1px `border-default` dividers.
*   **Data Contrast:** Inside the Truth Cards, `bg-muted` (`#E4E4E7` / `#27272A`) is utilized heavily to visually isolate monospace data payloads, ensuring the structured elements feel distinct from the Serif-driven narrative descriptions.

### 7. Consistency Notes With Other Pages
*   **Versus `/books/:bookId/chapters/:chapterNo`:** The Level 2 rail still begins with the same persistent book navigation. The difference is in the main workspace: Chapter is prose-forward, while Truth stays data-first with cards, key-value blocks, and entity tables.
*   **Versus `/books/:bookId/materials`:** The AI Tool Cards used for generating Truth behave identically to the material generation cards. Both require direct user intervention (`[ Apply ]`) before merging the AI's structured output into the system.

### 8. Approval Verdict
APPROVED PAGE BRIEF
