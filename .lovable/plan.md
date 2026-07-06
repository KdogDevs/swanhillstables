## Goals

1. Make every wizard field visible in the admin panel (not just profile basics).
2. Let admins create/edit client profiles, optionally with a claim-account email invite.
3. Reliably view the completed signed PDFs (not just the raw signature).
4. Generate one-off signing links tied to a client profile that clients can open to sign.
5. Delete lesson signups, unsigned pending forms, and boarding-application records.

## Data model changes (one migration)

- New table `public.boarding_signups` (parallels `lesson_signups`) — captures full boarding wizard payload linked to `user_id`. Populated by `boarding-signup-complete`. Admin RLS + `service_role`.
- Add `user_id uuid` (nullable, FK auth.users) to `public.lesson_signups` so signups link to their profile. Populate on submit.
- Add `sign_token text unique` and `token_expires_at timestamptz` to `client_documents` for admin-generated signing links.
- Grants + RLS in same migration (admins full, service_role all, no anon).

## Edge function changes

- `lesson-signup-complete`: also write `user_id` into `lesson_signups`.
- `boarding-signup-complete`: also insert a row in `boarding_signups` with the full payload; keep existing PDF/client_documents flow.
- New `admin-create-client`: super-admin-only. Given email/name/optional invite flag, creates auth user (with random password + invite email) or an admin-managed "shadow" profile (auth user with random password, email_confirm true, no invite). Returns user_id.
- New `admin-request-signature`: given `user_id` + `document_type`, mints a `sign_token`, inserts a pending `client_documents` row, emails the client a link `/sign/<token>`.
- New `sign-document-with-token`: public. Given token + signature data + signer name, generates the signed PDF via existing template code (boarding OR lesson docs), uploads to `signed-documents`, marks doc as signed, emails PDF to client, notifies admins.

## Frontend changes

- **`AdminClientsList.tsx`** — expand the client detail dialog:
  - Show ALL profile fields (including secondary EC, vet, farrier, address).
  - Inline edit mode for every field (update via `profiles`).
  - New "Add Client" button opens a dialog: name + email + phone + toggle "Send account invite" (calls `admin-create-client`).
  - New "Lesson Signups" and "Boarding Signups" sub-sections showing all records for this user_id with full fields (age, horse pref, goals, days, times, special_needs; horse details, tier, feed plan, addons, vet, emergency limits).
  - Delete buttons on lesson signups and boarding signups (with confirm).
  - "Request signature" button: pick doc type → calls `admin-request-signature`, shows generated link (copy-to-clipboard) and confirms email sent.

- **`AdminDocuments.tsx`** — replace fragile iframe preview with a robust `<object>` + fallback download link; strip `#toolbar` params that some browsers ignore. Delete button on pending/unsigned rows.

- **`DocumentPreviewDialog.tsx`** — new render path: try `<object type="application/pdf">`, fallback to `<iframe>`, always show a "Download PDF" button + open-in-new-tab.

- **New page `src/pages/SignDocument.tsx`** at route `/sign/:token`:
  - Fetches token via new public edge function `get-signing-doc` (returns doc type + signer name).
  - Shows the document, signature pad, and submits to `sign-document-with-token`.
  - Success confirmation; expired/invalid → friendly error.

- **`App.tsx`** — register `/sign/:token` route (lazy loaded).

## Deletion targets (admin-only, confirm dialogs)

- `lesson_signups` row → delete from Admin Client detail dialog and existing Lesson Signups list if present.
- `boarding_signups` row → same.
- `client_documents` row with status != 'signed' → delete from AdminDocuments client detail view.

## Security

- All new edge functions validate the caller: admin functions require `has_role(auth.uid(),'admin' or 'super_admin')`; `sign-document-with-token` is public but only accepts valid unexpired tokens.
- Token generation uses `crypto.randomUUID()` with a separate 32-char nonce; 30-day expiry.
- Client-side never exposes SUPABASE_SERVICE_ROLE_KEY.

## Out of scope

- Existing 3D tour, marketing pages, mobile styling — untouched.
- Not adding custom-upload documents (only barn_rules, waiver, boarding_agreement can be signed via link, matching your choices).

## Technical notes

- The current PDF viewing issue is because private-bucket signed URLs sometimes trigger a Content-Disposition download, and Chrome refuses to render some responses in an iframe. Using `<object>` + explicit `Content-Type: application/pdf` (already set on upload) plus a Download link fixes the "just shows signature / doesn't load" symptom.
- We keep the "signature-only" view as a debug fallback only when `pdf_url` is null (very old docs).
