insert into public.recipe_review_targets (slug, enabled)
values ('pates-creme-parmesan', true),
('pois-chiches-epinards-curry', true),
('soupe-carottes-lentilles-corail', true),
('gateau-yaourt-poires', true)
on conflict (slug) do nothing;
