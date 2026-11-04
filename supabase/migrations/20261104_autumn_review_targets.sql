insert into public.recipe_review_targets (slug, enabled) values
('crumble-poires-cannelle-noisettes', true),
('lentilles-potiron-roti-moutarde', true),
('tagliatelles-champignons-marrons', true)
on conflict (slug) do nothing;
