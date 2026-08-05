-- =====================================================================
-- TEAM MEMBER LOCATION
--
-- Added for the email sign off, which reads as a written signature:
-- name, job title, city, then the company mark. The city belongs on the
-- shared record with the rest of a person's identity rather than being
-- typed into the mail template, so it stays true in every place that
-- signs off on their behalf.
-- =====================================================================

ALTER TABLE public.team_members
    ADD COLUMN IF NOT EXISTS location TEXT;

COMMENT ON COLUMN public.team_members.location IS
    'Where this person is based, written the way they would write it in a signature, for example "Washington, DC".';
