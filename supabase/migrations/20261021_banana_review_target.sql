-- Enable the new recipe without altering existing targets or reviews.
insert into public.recipe_review_targets (slug, enabled)
values ('banana-bread-quatre-epices', true)
on conflict (slug) do nothing;
