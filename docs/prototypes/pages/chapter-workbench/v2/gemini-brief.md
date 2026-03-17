### 1. Page Role
The `/books/:bookId/chapters/:chapterNo` route is the core authorship and diagnostic environment of InkOS. It serves as the primary IDE workspace where the author engages in deep reading, prose generation, and targeted AI auditing. It is not just a text editor; it is a tactical control center where the narrative text intersects directly with the AI's structural awareness, truth documents, and diagnostic findings. 

### 2. Layout Recommendation
The page directly implements the 4-Level Layout System to maintain the fixed-viewport, desktop-grade experience. Each vertical pane manages its own `overflow-y: auto`, ensuring the application frame never shifts.

*   **Global App Rail (Left - 48px to 64px):** Fixed global routing routing, explicitly anchored.
*   **Contextual Sidebar (Left - 240px to 280px):** The Book Navigator. Contains the hierarchical chapter tree, allowing rapid switching between chapters without losing context. `border-right: 1px solid border-default`.
*   **Main Workspace (Center - Fluid Width):** The Reading and Revision Canvas. Background strictly `bg-base`. Content is horizontally centered within this pane but strictly constrained to a maximum width of 65 characters (approx. 600px - 700px) to privilege deep reading ergonomics.
*   **Context/Meta Panel (Right - 300px to 350px):** The Diagnostic & Truth Pane. Houses AI audit findings, entity context, and revision tool cards. Background strictly `bg-surface` to visually separate the "tooling" from the "canvas." `border-left: 1px solid border-default`.

### 3. Content Hierarchy
*   **Primary Focus:** The chapter prose housed in the Main Workspace. Rendered exclusively in `Body (Reading)` (high-legibility serif, 16px/18px, 1.6 line-height, `text-primary`). Must remain pristine and unobstructed by floating UI.
*   **Secondary Focus:** Active Audit Findings and Tool Cards in the Right Panel. These surface structural warnings, continuity errors, or prose suggestions corresponding directly to the text in the center pane.
*   **Tertiary Focus:** Chapter metadata (word count, status badges, structural position) located at the top of the Contextual Sidebar and the top edge of the Main Workspace. Rendered in `Meta` (12px, UI font, `text-secondary`).

### 4. Core Components
*   **The Reading Canvas:** A distraction-free column utilizing the required Serif font. Text selections or AI-targeted spans should use a 1px `border-strong` bottom border or a highly restrained `bg-muted` highlight—never colorful, glowing markers. 
*   **Audit Tool Cards:** Rendered in the Right Panel. Follows the strict tool card foundation: 1px `border-default` with a muted header (`heading` 14px, UI font, `text-secondary`). Structured payloads (e.g., JSON rules or entity IDs) must be presented in `bg-muted` blocks using JetBrains Mono.
*   **Inline Diff Views:** When evaluating an AI rewrite within a tool card, deletions use `accent-destructive` text with a line-through, and additions use `accent-success` with a subtle background tint or 1px bottom border. 
*   **Chapter Node List:** Dense, 1px-bordered rows in the left sidebar. The active chapter row uses `bg-accent` and a 2px left border of `accent-primary`. Padding is tight (4px to 8px).

### 5. Button And Action Rules
*   **No Hover Concealment:** Critical actions for chapters or audits (Edit, Apply, Dismiss) must be distinctly visible at all times. They may drop to `text-muted` when inactive, but must not require hover discovery.
*   **Tool Card Action Bars:** Every Audit Tool Card in the right panel must terminate with a full-width action bar containing explicit verdicts: `[ Apply Revision ]`, `[ Edit ]`, `[ Ignore ]`. 
*   **Button Geometry:** Strictly 4px `border-radius`. 
    *   *Apply/Accept:* Solid `accent-primary`, white text.
    *   *Dismiss:* Ghost or Secondary button, explicitly delineated with 1px `border-default`.

### 6. Light/Dark Notes
*   **Legibility Parity:** The reading experience must remain flawless in both modes. In Light mode (`bg-base` `#FFFFFF`, `text-primary` `#09090B`), the canvas feels like paper. In Dark mode (`bg-base` `#0D0D0D`, `text-primary` `#FAFAFA`), the contrast is sharp without halation.
*   **Panel separation:** The shift from the `bg-base` of the writing canvas to the `bg-surface` (`#F4F4F5` Light / `#18181A` Dark) of the right-hand diagnostic panel defines the spatial hierarchy purely through subtle tonal shifts and the 1px `border-default`, completely avoiding drop shadows.
*   **Audit States:** Warnings (`accent-warning`) and errors (`accent-destructive`) used in diagnostic flags must maintain WCAG AAA compliance against `bg-surface` in both Light and Dark paradigms. 

### 7. Consistency Notes With Other Pages
*   **Alignment with `/books/:bookId/materials`:** The Right Panel adopts the exact same visual signature as the live preview and approval cards used in the materials split-pane workflow. Tool cards operate with the same input/output architecture.
*   **Alignment with `/chief`:** Chat / Assistant threads that originate in the `/chief` route but open contextually in this right panel must maintain the flat, non-bubble, line-separated aesthetic (`border-subtle`).
*   **Typography:** Strict enforcement of the UI vs. Reading font dichotomy. The center area is exclusively Serif; the sidebars are exclusively System Sans / Monospace.

### 8. Approval Verdict

APPROVED PAGE BRIEF