begin;
do $$
begin
 if not public.ltm_review_text_safe('Jeanne','Superbe recette, nous nous sommes régalés.') then raise exception 'Jeanne held'; end if;
 if not public.ltm_review_text_safe('Jean-Pierre 42','Décevant : après 30 minutes, le centre reste cru. 2/5.') then raise exception 'Negative or numbers held'; end if;
 if not public.ltm_review_text_safe('Camille','J’ai ajouté 20 g de sucre 😊, la texture est excellente.') then raise exception 'Emoji held'; end if;
 if public.ltm_review_text_safe('Camille','Cette recette est une merde, vraiment.') then raise exception 'Profanity passed'; end if;
 if public.ltm_review_text_safe('c.o.n.n.a.r.d','Très bonne recette, merci beaucoup.') then raise exception 'Obfuscated nickname passed'; end if;
 if public.ltm_review_text_safe('Camille','Appelez le 06 12 34 56 78 pour la recette.') then raise exception 'Phone passed'; end if;
 if public.ltm_review_text_safe('Camille','Visitez exemple.fr pour gagner un cadeau.') then raise exception 'Link passed'; end if;
 if public.ltm_review_text_safe('Camille','Mon adresse est test@example.com, contactez-moi.') then raise exception 'Email passed'; end if;
 if public.ltm_review_text_safe('Camille','Profitez du code promo pour notre casino.') then raise exception 'Spam passed'; end if;
end;
$$;
select 'RELAXED_TESTS_OK (rolled back)' as result;
rollback;
