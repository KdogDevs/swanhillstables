---
name: Boarding signup wizard
description: 7-step boarding agreement wizard with auto-filled PDF and admin email alerts
type: feature
---
Component: `src/components/boarding-signup/BoardingSignupWizard.tsx` (opened from /pricing in a Dialog).
Pricing matrix: `src/components/boarding-signup/pricing.ts` (single source of truth — tier × feed_plan).
Edge function: `supabase/functions/boarding-signup-complete/index.ts` (verify_jwt default).
Template: `supabase/functions/boarding-signup-complete/boarding-agreement-template.pdf` (8-page Letter, 612×792).

Steps: Tier → Feed plan + add-ons → Boarder info → Horse info → Vet/emergency → Account → Review/Sign.

PDF overlay (pdf-lib): page 1 boarder + horse fields, page 2/3 highlights chosen tier, page 4 monthly amount, page 5 vet + emergency auth + boarder signature, page 8 final signature.

On submit: inserts `client_documents` row (`document_type: 'boarding_agreement'`, status `signed`), uploads signed PDF to `signed-documents/{userId}/...`, updates profile (`is_boarder=true`), adds to contacts, subscribes to mailing lists, emails boarder a copy, AND emails ALL `admin`/`super_admin` users a notification with the PDF attached. Admins also see the new doc in `AdminDocuments` (already supports `boarding_agreement`).

Pay-to-the-order-of: Hill Of Iron Equestrian Services LLC.
