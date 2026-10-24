# Atelier UI / interaction inventory

2026-10-25. The interface uses a background-free F mark, self-hosted Pretendard, a consistent 24-unit icon grid and continuous corners where supported. No fixed sidebar, uppercase category eyebrows or repeated full-width divider bars.

| Surface | Behavior and states |
|---|---|
| Global navigation | Desktop floating segmented navigation; mobile bottom dock; active page declared to assistive technology |
| Account | High contrast labeled login button; account name and settings after sign-in |
| Creation | Direct blank creation, expanding prompt composer, template route; real loading/error states |
| Documents | Grid/list, search, status filter; keyboard-openable action menu, Escape and focus restoration |
| Editor | Contextual question tools; undo/redo; recovery, dirty/saving/saved states; separate save/publish |
| Type / options | Custom searchable popover; selected marker, Arrow/Home/End/Enter/Escape/Tab, bounded scroll and viewport collision handling |
| Date / deadline | Custom calendar; month/year search; daily arrow navigation; clear/today/done; local time converted to stored UTC |
| Time | Custom hour/minute menus; keyboard selection; current time and clear |
| Color | Custom palette and editable hex input; full hexadecimal colors; no operating-system color popup |
| Checkbox / choices | Custom visual controls with real input semantics and focus treatment |
| Rating / scale | Roving tab stop and arrow/Home/End selection |
| Dialogs | Native dialog focus containment, Escape, backdrop close and animated exit; small-screen sheet |
| Preview | Isolated preview responses; desktop/mobile paper sizes |
| Responses | Loading, empty, errors, search, table/summary, pagination and export scope disclosed |
| Integrations | Explicit configured/unconfigured/error states, revoke and retry; no simulated OAuth success |
| Motion | Paper hover, navigation press, unfolding composer and popovers; reduced-motion override |

Manual checks during this revision: desktop home/login visibility; composer expand/focus; editor type search; Escape focus return; custom deadline calendar; real AI generate/save/review. Responsive layouts have CSS breakpoints; this revision does not claim a comprehensive device/accessibility audit.

Reference principles:
- https://www.radix-ui.com/primitives/docs/components/popover — dismissal, focus restoration, portals, collision boundaries
- https://linear.app/docs/editor — contextual editing actions
- Local Lectranscribe web/mobile visual references supplied by the user

Research matrix and remaining product features are tracked in FEATURE-RESEARCH.md.

## Internationalization

English/Korean UI, weighted browser language matching, persistent header switch, localized calendars/dates/counts, translated validation and API errors, and bilingual help. Latin typography uses self-hosted Inter. English copy uses short action labels. Form content is never implicitly translated. Respondent chrome can be fixed per form or follow browser language. Server-rendered fixture tests cover English workspace/account/integrations/responses/dialogs and language isolation between public examples.

## Document editor

Questions are edited directly on a white document canvas. Block controls live in a side gutter. Enter adds a question; Shift+Enter keeps a line break; slash opens a searchable type palette when a title is empty or fully selected. A plus inserts after the current block. A draggable handle opens block actions and supports reordering. Move-up/down actions provide a keyboard and touch alternative. Conditional blocks cannot move before their references.

Choices support Enter to insert the next option. IME composition is excluded from structural shortcuts. Titles grow with their content. Descriptions appear on demand. Cmd/Ctrl+S saves; Cmd/Ctrl+Z and Shift+Z use draft history. Empty titles receive recoverable draft names. Cloud saving and publishing remain explicit.

Published forms use the same document rhythm. Repeated section dividers and classic-layout progress metadata are removed. A progress indicator remains for one-question-at-a-time forms.

DOM event and ordering tests cover these behaviors. They do not substitute for cross-browser visual review.
