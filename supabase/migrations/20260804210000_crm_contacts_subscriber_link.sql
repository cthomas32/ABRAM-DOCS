-- Links a conference contact to the newsletter subscriber they became.
--
-- Additive only. Nothing here drops or rewrites an existing object, because
-- the capture route and the admin console both read these tables live.
--
-- The column is deliberately nullable and deliberately not unique in any
-- direction that would imply consent. Most contacts will never carry a value
-- here, and that is the correct state for somebody who handed over a card
-- without asking to be mailed. A row only gets a subscriber when the person
-- ticked the box, or when they came back to the site later and signed up
-- themselves.

alter table public.crm_contacts
  add column if not exists subscriber_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'crm_contacts_subscriber_id_fkey'
  ) then
    alter table public.crm_contacts
      add constraint crm_contacts_subscriber_id_fkey
      foreign key (subscriber_id) references public.subscribers(id) on delete set null;
  end if;
end $$;

comment on column public.crm_contacts.subscriber_id is
  'The newsletter subscriber this contact became, or null. Set only when the person ticked the consent box at capture, or subscribed on the site themselves afterwards. Deleting a subscriber clears this rather than removing the contact.';

-- Read path for the drawer and the pipeline filter: which contacts are on the list.
create index if not exists idx_crm_contacts_subscriber
  on public.crm_contacts (subscriber_id)
  where subscriber_id is not null;

-- Read path for the other direction: a site signup looking for a contact it
-- matches. Mirrors the existing owner_email index but without the profile, so
-- one address can be resolved across every owner in one hit.
create index if not exists idx_crm_contacts_email_lower
  on public.crm_contacts (lower(email))
  where email is not null and archived = false;
