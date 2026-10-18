begin;
do $$
declare a uuid:=gen_random_uuid(); r uuid:=gen_random_uuid(); s text; before_count bigint;
begin
 select count(*) into before_count from public.recipe_reviews;
 if not public.ltm_review_text_safe('Camille','Très bonne recette, résultat moelleux.') then raise exception 'Positive text held'; end if;
 if not public.ltm_review_text_safe('Camille','Recette difficile, résultat trop sec.') then raise exception 'Negative text held'; end if;
 if public.ltm_review_text_safe('Camille','Recette bonne, téléphone 0612345678') or public.ltm_review_text_safe('Camille','Très bonne recette exemple.fr') or public.ltm_review_text_safe('Camille','Très bonne recette, connard') then raise exception 'Unsafe auto approval'; end if;
 s:=public.ltm_submit_review_photo('roules-cannelle-moelleux',1,'Camille','Recette difficile, résultat trop sec.',a,r,true,'',null);
 if s<>'approved' then raise exception 'Auto approval failed'; end if;
 if not exists(select 1 from public.ltm_reviews_with_photos('roules-cannelle-moelleux') where comment='Recette difficile, résultat trop sec.' and rating=1) then raise exception 'Not public'; end if;
 update public.recipe_reviews set status='pending' where receipt_hash=encode(sha256(convert_to(r::text,'UTF8')),'hex');
 s:=public.ltm_submit_review_photo('roules-cannelle-moelleux',1,'Camille','Recette difficile, résultat trop sec.',a,r,true,'',null);
 if s<>'pending' then raise exception 'Retry overrode moderation'; end if;
 perform public.ltm_withdraw_review(r);
 s:=public.ltm_submit_review_photo('roules-cannelle-moelleux',5,'Camille','Très bonne recette, résultat moelleux.',gen_random_uuid(),gen_random_uuid(),true,'','/9j/2Q==');
 if s<>'pending' then raise exception 'Photo auto approved'; end if;
 s:=public.ltm_submit_review_photo('roules-cannelle-moelleux',5,'Camille','Recette bonne, téléphone 0612345678',gen_random_uuid(),gen_random_uuid(),true,'',null);
 if s<>'pending' then raise exception 'Personal data public'; end if;
 if has_function_privilege('anon','public.ltm_submit_review_photo_checked(text,integer,text,text,uuid,uuid,boolean,text,text)','EXECUTE') then raise exception 'Private helper exposed'; end if;
 if (select count(*) from public.recipe_reviews)<>before_count+3 then raise exception 'Unexpected row count'; end if;
end;
$$;
select 'AUTO_TESTS_OK (rolled back)' as result;
rollback;
