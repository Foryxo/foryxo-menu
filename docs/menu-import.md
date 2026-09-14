# Menu Content Import

Onboarding supports six content paths (spec §23). Everything lands in a **staging area** —
nothing auto-publishes without human confirmation.

## Paths

1. **Manual entry** — builder/dashboard forms.
2. **Spreadsheet (XLSX/CSV)** — downloadable template with columns:
   `category, item_fa, item_en, description_fa, description_en, price, old_price, available, image_filename, tags, allergens, modifier_group`.
   Parsed with PapaParse (CSV) — validation per row.
3. **Existing PDF menu** — uploaded, attached to the project; extraction produces staged rows.
4. **Images/screenshots** — uploaded; same staging flow.
5. **Send later** — project starts with placeholders; reminders queued.
6. **Foryxo data entry** — quoted as `content.entry_50` + extras; done by the team.

## Staging & validation

Each staged row carries: parsed values, per-field validation state, duplicate detection
(normalized Persian name match within the category), missing-price / missing-translation /
missing-category flags, and image-match state (image_filename not found in uploads).

The import UI shows a review table: fix/accept/reject per row, with counts of issues. **Publish
requires explicit human confirmation** — enforced in the API (staged rows must be accepted; the
action is audited). A `pdf_confirm` message template exists to ask the client to confirm extracted
content (templates live in `message_templates`, editable in Admin → Templates).

## Image pipeline

Uploads (dashboard/files or import): MIME allowlist (jpeg/png/webp/avif), size caps,
sanitized filenames, EXIF stripped, sharp pipeline generates WebP/AVIF variants + thumbnails,
original archived. Virus scanning is an interface point pending a wired scanner — flagged
`EXTERNAL_VERIFICATION_REQUIRED` in FINAL-AUDIT.md.

## Developer notes

Parser lives with the content domain; pure transforms are unit-testable without a DB. Row
validation never mutates production menu tables — only staging tables, then a single audited
"apply" action writes draft-version rows.
