# Design System Document

## 1. Creative North Star: "Underground Brutalism"
This design system is built to move away from the polite, rounded "SaaS" aesthetic. The Creative North Star is **Underground Brutalism**. It draws inspiration from wheat-paste concert posters, vinyl sleeve typography, and the raw energy of a dark club. 

The system rejects the "standard" web container. Instead of soft corners and drop shadows, we use **Hard Edges (0px radius)**, high-contrast typography, and depth through tonal layering. It is clean and minimal, yet carries an aggressive, intentional edge that feels bespoke to the music industry.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, nocturnal spectrum. We do not use standard "UI Grey." We use variations of ink and obsidian to create hierarchy.

### The Palette (Material Design Mapping)
*   **Surface / Background:** `#131313` (The base "ink").
*   **Surface-Container-Lowest:** `#0E0E0E` (Used for deep "recessed" areas).
*   **Primary (Accent):** `#FFB4AC` (Light tone) / **Primary-Container:** `#E01B24` (The vivid signature red).
*   **On-Surface (Text/Icons):** `#E5E2E1` (Off-white for readability).

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to separate sections.
Boundaries must be defined through background shifts. If you have a sidebar, do not draw a line between it and the main content. Instead, set the Sidebar to `surface-container-lowest` and the main stage to `surface`. The edge of the color change is the border.

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of matte paper.
1.  **Level 0 (Background):** `surface` (`#131313`).
2.  **Level 1 (Sections):** `surface-container-low` (`#1C1B1B`).
3.  **Level 2 (In-section Cards):** `surface-container-highest` (`#353534`).

### Signature Textures
Main CTAs should use a subtle vertical gradient: `primary-container` (`#E01B24`) to a slightly darker `on-primary-fixed-variant` (`#93000E`). This prevents the red from looking "flat" or "cheap" on high-res displays.

---

## 3. Typography: Editorial Dominance
We use a high-contrast scale to create an editorial, non-corporate feel. 

*   **Headings (Display-LG to Headline-SM):** Use **Inter** (Bold or Extra Bold). Set `letter-spacing` to `-0.02em`. For a more "underground" feel, use **Bebas Neue** for specific data-heavy headlines to introduce a condensed, vertical rhythm.
*   **Body & Labels:** Use **Inter** (Regular to Medium). 

**Hierarchy Strategy:** 
To maintain the "edgy" feel, use `display-lg` (3.5rem) for main page titles but keep `label-sm` (0.68rem) in All-Caps for metadata. This "Big/Small" contrast mimics high-end music magazines.

---

## 4. Elevation & Depth
Traditional drop shadows are strictly prohibited. We communicate "lift" through **Tonal Layering** and **Glassmorphism**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on top of a `surface-container-low` section. The darker "pit" creates a sense of depth without the clutter of shadows.
*   **Glassmorphism (The "Floating" State):** For elements like the Floating Action Button or dropdown menus, use a semi-transparent `surface-bright` (`#3A3939` at 70% opacity) with a `backdrop-filter: blur(20px)`. This makes the element feel like it's hovering in the smoke of a club.
*   **The "Ghost Border" Fallback:** If a layout feels too muddy, use a "Ghost Border": 1px solid `outline-variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Sidebar (The Navigation Spine)
*   **Background:** `surface-container-lowest` (`#0E0E0E`).
*   **Interaction:** Active links use a left-aligned 4px vertical bar of `primary-container` (`#E01B24`).
*   **Typography:** All-caps `label-md` for category headers to create a "grid-like" structure.

### Cards & Tables (Data Handling)
*   **Structure:** No dividers. Use `surface-container-high` (`#2A2A2A`) for table headers and `surface` for alternating rows (Zebra striping is done through tonal shift, not lines).
*   **Padding:** Aggressive white space. Give data room to breathe.
*   **Corner Radius:** **Strictly 0px.** Every element must have sharp, 90-degree corners.

### Floating Action Button (FAB)
*   **Visuals:** A perfect square (not a circle). 
*   **Color:** `primary-container` (`#E01B24`).
*   **Icon:** High-contrast white (`#FFFFFF`).
*   **Effect:** No shadow. Use a 2px `outline` of `#FFFFFF` that only appears on `:hover` to create a "flash" effect.

### Input Fields
*   **Style:** Underline only. No box. 
*   **Focus State:** The underline transitions from `outline` to `primary-container` (`#E01B24`) with a 0.2s ease.

### Additional Component: The "Gig Status" Chip
*   **Style:** High-contrast, rectangular blocks.
*   **Confirmed:** Black text on a White background.
*   **Cancelled:** White text on a Red (`#E01B24`) background.

---

## 6. Do's and Don'ts

### Do:
*   **Use Intentional Asymmetry:** Align text to the far left and keep large "dead zones" of black space on the right. 
*   **Embrace the Dark:** Let 80% of the screen be shades of black/dark grey. The Red should be a "surgical strike"—used only where you want the eye to land instantly.
*   **Tighten Tracking:** On large headlines, reduce letter spacing to make the words feel like a singular graphic block.

### Don't:
*   **No Rounded Corners:** Never use `border-radius`. Not for buttons, not for cards, not for checkboxes.
*   **No Gradients (Except CTAs):** Avoid "glossy" looks. The underground scene is matte and raw.
*   **No Corporate Icons:** Avoid thin, playful, or "friendly" line icons. Use bold, solid, or stencil-style iconography.
*   **No Centered Layouts:** Keep everything left-aligned to mimic the layout of a technical rider or a setlist.

### Accessibility Note:
While we are going for an "edgy" look, ensure `on-surface` text on `surface` backgrounds maintains a contrast ratio of at least 7:1. The vivid red (`#E01B24`) should be used sparingly for text as it can be vibrating for some users; prioritize it for functional UI elements and accents.