-- Card variations: one message, several sizes.
--
-- A post picks one card, and the same message usually has to go out as a
-- square on LinkedIn, a portrait on Instagram and a story. Those were three
-- unrelated rows: edit the headline and you edited one of them, and the other
-- two went out saying the old thing.
--
-- A variation group is a set of rows sharing `variation_id`, each with its own
-- `format` and the same copy. It is deliberately the same shape as `set_id`,
-- which groups the slides of a carousel, and the two do not overlap: a slide
-- belongs to a set, a size belongs to a variation group, and a carousel slide
-- can still have its own sizes.
--
-- Null means a card standing on its own, which is most of them and is why the
-- column is nullable rather than backfilled with a group of one.

alter table public.social_image_assets
  add column if not exists variation_id uuid;

comment on column public.social_image_assets.variation_id is
  'Groups the sizes of one card. Rows sharing this carry the same copy in different formats. Null for a card with no other sizes.';

-- Every read is "the other sizes of this card", so the group is the key.
create index if not exists social_image_assets_variation_id_idx
  on public.social_image_assets (variation_id)
  where variation_id is not null;

-- One size per group. Two squares in the same group is the ambiguity the
-- feature exists to remove: the post picker would have no way to say which
-- one it meant, and the copy propagation would have two rows to write and no
-- reason to prefer either.
create unique index if not exists social_image_assets_variation_format_key
  on public.social_image_assets (variation_id, format)
  where variation_id is not null;
