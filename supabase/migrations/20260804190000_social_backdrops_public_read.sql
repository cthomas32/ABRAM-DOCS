-- The image library, readable by the site.
--
-- The pictures were uploaded to sit behind social cards, and they are the
-- best thing we have: they are ours, they are of real work, and a flat
-- colour behind a headline has never once looked as good as one of them.
-- The marketing pages want the same shelf, so a photograph uploaded on a
-- Tuesday can appear behind a section on the site with no deploy.
--
-- The files were always public: the bucket has public read, because the
-- renderer fetches them with no session. What was private was the list of
-- them, which held a title, a colour, a size and a credit. None of that is
-- worth protecting once the picture itself is served to anybody who asks,
-- and keeping it locked would mean the site reading this table with a
-- service key on a page anybody can load.
--
-- Writes stay signed in. Uploading is still a person in the studio.

drop policy if exists "Public read of the image library" on public.social_backdrop_images;
create policy "Public read of the image library"
    on public.social_backdrop_images for select to anon
    using (true);

comment on table public.social_backdrop_images is
    'Photographs uploaded for use behind social cards and behind sections on the site. A card stores the storage_path, so a row here is never read to render one.';
