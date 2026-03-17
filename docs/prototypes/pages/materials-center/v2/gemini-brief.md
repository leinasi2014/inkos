### 1. Page Role
The `/books/:bookId/materials` route serves as the engine room for a book's lore, rules, and reference documents. It is a dual-purpose environment: a structured library of highly organized, undeniable facts (Applied Materials), and an AI generation sandbox for ideating and refining new context (Drafts/Generation Workflow). It bridges raw user intent with structured AI context, ensuring that world-building elements are cleanly delineated from prose.

### 2. Layout Recommendation
This page must preserve the shared 4-pane foundation without over-fragmenting the working area. Book navigation remains visible in Level 2, the materials index/library can live beneath it, and Level 3 should stay focused on one primary generation flow at a time rather than nesting another heavyweight split-pane inside the workspace.

*   **Level 2 Sidebar:** 
    *   Starts with persistent book navigation (`Overview / Chapters / Truth / Materials`).
    *   Uses the remaining height for material type switching and a dense library list (`Drafts`, `Applied`, `Discarded`).
*   **Level 3 Main Workspace:** 
    *   Holds the generation form at the top and the active Tool Card / approval surface below it in a single dominant work column.
    *   Avoid cramming the form, full library, preview, and inspector-equivalent data into one horizontal split. The author should be able to read one candidate flow comfortably.

### 3. Content Hierarchy
1.  **Header Row (Left Pane):** Simple breadcrumb (`Book Title / Materials`). 
2.  **Generation Input (Left Pane):** A dense, multiline text area for prompting new materials, paired with a succinct primary `[ Generate ]` action.
3.  **Segmented Control (Left Pane):** Strict toggle between `Drafts` (pending AI outputs) and `Applied` (committed materials).
4.  **Library Index (Level 2 Sidebar):** A high-density list of existing materials. Uses `text-primary` for the material name and `text-secondary` for metadata (e.g., date, type, token weight). Separated by `border-subtle`.
5.  **Detail/Tool Card View (Level 3):** The dominant visual element. Displays the structured payload, compare summary, and the fixed-bottom action bar for approval logic.

### 4. Core Components
*   **Material List Items:** tightly padded rows (e.g., 8px vertical, 12px horizontal). Hover states trigger `bg-accent`. Active selection uses a 1px `border-strong` outline or an `accent-primary` left border indicator.
*   **Tool Cards (The AI Generation Preview):** 
    *   Rendered centrally in the right pane with a max-width of 800px to maintain reading comfort.
    *   1px `border-default` with a strict 4px border-radius.
    *   Card header (`bg-muted`) displays the operation: `[Tool: Generate Material - "Character Bio"]`.
    *   Body uses monospace font for any JSON, diffs, or raw parameter data, set against `bg-surface`.
    *   Prose generated within the material uses the standard `Body (UI)` font (13px Inter/SF Pro), as materials are reference data, not the final chapter prose (which uses Serif).
*   **Data Tags:** Inline entity tags (e.g., `[Location]`, `[Character]`) use `bg-surface`, `border-subtle`, 2px radius, and 12px monospace text.

### 5. Button And Action Rules
*   **Action Visibility:** The approval workflow is destructive/constructive and must never rely on hover states.
*   **Tool Card Action Bar:** Affixed to the bottom of the structured result card, spanning full width with a 1px top `border-default`.
    *   `[ Apply ]`: Solid `accent-success` (if adding new) or `accent-primary` (if updating). Must distinctly signify moving a draft to "Applied".
    *   `[ Edit ]`: Secondary button (`border-default`, transparent bg). Allows manual override of the AI's generated metadata before applying.
    *   `[ Regenerate ]`: Secondary button.
    *   `[ Cancel ]`: Ghost button (no border, `text-secondary`). Destroys the draft.
*   All buttons remain strictly at a 4px border-radius with crisp typography.

### 6. Light/Dark Notes
*   Strict parity is required. Do not use shadows to lift the Tool Card off the right pane's background. Instead, rely on the contrast between `bg-base` (the pane background) and `bg-surface` (the card background), framed by `border-default`.
*   During active AI generation, the tool card body can pulse slightly using `bg-muted` to `bg-surface` transitions, avoiding any colorful or playful loading spinners. A simple `accent-warning` dot or mono-color terminal block cursor is preferred for loading states.

### 7. Consistency Notes With Other Pages
*   **Matches `/books/:bookId/truth`:** The presentation of the structured data in the main Tool Card must inherit the exact key-value layouts and monospace styling used in the Truth documents.
*   **Matches `/chief`:** The generation input area in the Left Pane should feel like a miniaturized version of the `/chief` command bar—utilitarian, devoid of chat-bubble aesthetics, and highly responsive.
*   **Matches `/books/:bookId/chapters/:chapterNo`:** The persistent book navigation remains identical, but the main workspace should stay focused on materials generation rather than mimicking a chapter editor with extra nested panes.

### 8. Approval Verdict
APPROVED PAGE BRIEF
