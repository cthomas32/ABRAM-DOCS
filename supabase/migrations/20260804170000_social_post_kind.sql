-- What a post is for.
--
-- The calendar could say when a post goes out, on which channel, and with
-- which card, and it could not say what the post was doing there. Left
-- unrecorded, every week drifts to the same place: seven cards about ABRAM,
-- which is an account nobody follows and a feed nobody shares.
--
-- Five kinds, and the mix across a week is the point of recording them:
--
--   product   ABRAM doing something. A screen, a shipped change, an outcome.
--   craft     Useful with the product taken out. A definition, a checklist,
--             the four places a shoot day quietly leaks time.
--   market    A number or a finding about the industry, carrying the name of
--             whoever published it and a link to it in the note.
--   story     How we think about production and what we are building. The
--             posts that earn a follow rather than a click.
--   article   Sends the reader to something we wrote: a blog post or a help
--             article. The post is the trailer and the page is the thing.
--
-- Defaulting to product is a statement about the rows that already exist
-- rather than about the ones to come: everything filed before this column
-- was a product post, and pretending otherwise would put a false balance in
-- the first week that reads it.

alter table public.social_posts
  add column if not exists kind text not null default 'product';

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'social_posts_kind_check') then
        alter table public.social_posts
            add constraint social_posts_kind_check
            check (kind in ('product', 'craft', 'market', 'story', 'article'));
    end if;
end $$;

comment on column public.social_posts.kind is
  'What the post is for: product, craft, market, story, article. Read as a mix across the week, which is what stops a feed that is only ever about us.';

-- Every read of this is "the mix over a stretch of days", so the date leads.
create index if not exists social_posts_kind_idx
  on public.social_posts (scheduled_for, kind);
