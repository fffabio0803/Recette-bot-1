insert into public.recipe_review_targets (slug, enabled)
values ('cookies-moelleux-chocolat', true)
on conflict (slug) do nothing;
