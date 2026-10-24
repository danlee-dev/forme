# Forme

A considered form builder, built with Next.js 16, React 19, TypeScript and Supabase.

## Development

Node 24. Run npm ci, copy .env.example to .env.local and fill in your own project settings, then npm run dev.
Run database/schema.sql, then database/versions.sql once on an empty Supabase project. All private tables use RLS; write access is restricted to the authenticated server layer.
The SUPABASE_SECRET_KEY and INTEGRATION_ENCRYPTION_KEY must never use NEXT_PUBLIC_ prefixes or be committed.

## Commands

- npm run dev — localhost development
- npm run build — production build
- npm run typecheck — TypeScript
- npm test — domain validation tests
- npm run mcp — stdio MCP bridge (FORME_URL and FORME_API_KEY required)

## Product and design

See docs/PRODUCT.md, docs/FEATURE-RESEARCH.md (93 audited requirements), docs/ROADMAP.md and docs/RELEASE-VERIFICATION.md. The research matrix explicitly distinguishes implemented features from missing competitor features. This release is not full Tally/Google Forms parity or a verified large-scale SaaS.

The Atelier interface replaces the fixed sidebar with top navigation and a mobile bottom dock. Form types, selects, calendars, time and color controls use custom UI with keyboard support. The product chrome is monochrome, with locally drawn 24-unit SVG symbols in components/icons.tsx. Form-specific colors are separate from product controls. Fonts are self-hosted Pretendard under SIL OFL (public/fonts/LICENSE.txt). Motion is transform/opacity focused and honors prefers-reduced-motion.

## Document editing

Questions are edited on a continuous document canvas. Use Enter for the next question, Shift+Enter for a line break, and slash on an empty or selected title for the searchable block palette. Side controls insert, duplicate, reorder and configure blocks. Keyboard move actions complement pointer dragging. Cmd/Ctrl+S saves; Cmd/Ctrl+Z and Shift+Z undo/redo. Draft saving and publication remain separate.

## Languages

English and Korean are supported across the workspace, editor, account, responses, integrations and help. New visitors use their supported browser language, falling back to English. The header switch persists an explicit preference in a first-party cookie. Inter is self-hosted for Latin text, with Pretendard for Korean; both licenses are in public/fonts.

Form content is separate from application language. New forms and AI generation use the creator’s selected language. Form settings can fix respondent controls to English/Korean or follow the respondent’s browser. Existing questions and responses are never automatically translated. The English NEXT example is /f/next-homecoming-en; the Korean example remains /f/next-homecoming. Both are closed and keep event details TBD.

## Main routes

- / — workspace and form drafts
- /templates — reusable templates
- /forms/:id/edit — editor, design, publishing settings
- /f/:slug — public responder
- /f/next-homecoming — NEXT homecoming example (details TBD, collection closed)
- /responses — owner-only responses, summaries, CSV
- /integrations — Sheets, keys, MCP
- /docs — end-user and developer instructions

## Integrations

Google Sheets currently uses the supplied Apps Script bridge. Set script properties FORME_SECRET and SPREADSHEET_ID and deploy it yourself. Forme stores submissions before attempting delivery; failed deliveries can be retried. ScriptLock and submission IDs prevent duplicate rows. OAuth one-click Sheets is not implemented.

AI uses Vercel AI Gateway through AI SDK 7, with OIDC on Vercel or AI_GATEWAY_API_KEY. Default model google/gemini-2.5-flash. AI also reviews existing questions and offers individually applicable suggestions. Users authenticate before generation; database-backed per-user limits apply. Unavailable AI never falls back to fake generation.

The authenticated Streamable HTTP endpoint is /api/mcp. Use a personal Forme API key in Authorization: Bearer. Tools: list_forms, get_form, create_form, update_form, publish_form, list_responses.
Claude Code command is available on /integrations. Codex and other MCP clients can use the same endpoint; a stdio bridge is in connectors/mcp-server.mjs. Plugin source lives in plugins/forme.

## Deployment

Connect this repository to Vercel, set the environment variables on the intended project, and deploy. Add the deployed site URL to Supabase Auth URL Configuration for email links and password recovery. Never include DATABASE_PASSWORD in Vercel; the application uses HTTPS Data API, not direct DB access.

## Data boundaries

Public forms expose saved publication snapshots, not private drafts. API keys are stored as SHA-256 hashes; Sheets secrets use AES-256-GCM. APIs check ownership on every private operation. Submissions use server validation, size bounds, idempotency, atomic quota and deadline checks. CSV formula injection is neutralized.
No prior NEXT respondent data is included. Example forms are not collecting real event applications.

## Known limitations

No billing, organization collaboration, file uploads, quiz scoring, advanced calculation engine, custom domains or email notification delivery yet. See the research matrix. Run load testing, abuse protection, observability and recovery exercises before claiming high-volume readiness.

## Rules and response exports

Block settings support up to ten visibility rules joined with AND/OR, including numeric, string, option membership and empty/answered comparisons. The client and server share the same evaluator. Deleting a referenced question requires an explicit visibility review before publication. Field settings allow a custom validation error message.

The authenticated GET /api/v1/forms/:id/responses/export streams all saved responses as CSV using a timestamp/id cursor and an export cutoff. Current questions use normal columns; answers to removed questions retain their original labels in an Archived answers (JSON) column. Exports are not limited to the table page or local search filter. Search and charts still use loaded rows, and the UI says so. Background exports for very large datasets remain a roadmap item.
