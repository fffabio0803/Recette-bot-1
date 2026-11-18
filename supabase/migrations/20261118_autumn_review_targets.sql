insert into public.recipe_review_targets (slug, enabled)
values ('veloute-potimarron-chataignes', true),
('gratin-poireaux-pommes-de-terre', true),
('pommes-four-cannelle-noisettes', true)
on conflict (slug) do nothing;
