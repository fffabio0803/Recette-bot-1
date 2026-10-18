begin;
do $$
declare a uuid:=gen_random_uuid(); r uuid:=gen_random_uuid(); r2 uuid:=gen_random_uuid(); rid uuid; n bigint; s text;
begin
 select count(*) into n from public.recipe_reviews;
 perform public.ltm_submit_review_photo('roules-cannelle-moelleux',5,'Testeur','Essai technique temporaire à annuler.',a,r,true);
 select id into rid from public.recipe_reviews where receipt_hash=encode(sha256(convert_to(r::text,'UTF8')),'hex');
 s:=public.ltm_edit_review('roules-cannelle-moelleux',r,1,'Testeur','Recette difficile, résultat trop sec.',true);
 if s<>'approved' or (select count(*) from public.recipe_reviews)<>n+1 then raise exception 'Edit must replace one rating'; end if;
 perform public.ltm_edit_review('roules-cannelle-moelleux',r,1,'Testeur','Recette difficile, résultat trop sec.',true);
 if (select edit_count from public.recipe_reviews where id=rid)<>1 then raise exception 'Retry consumed quota'; end if;
 begin
   perform public.ltm_edit_review('roules-cannelle-moelleux',gen_random_uuid(),1,'Testeur','Recette difficile, résultat trop sec.',true);
   raise exception 'Invalid receipt accepted';
 exception when raise_exception then if sqlerrm<>'INVALID_RECEIPT' then raise; end if; end;
 begin
   perform public.ltm_edit_review('quiche-lorraine-recette-authentique',r,1,'Testeur','Recette difficile, résultat trop sec.',true);
   raise exception 'Wrong recipe accepted';
 exception when raise_exception then if sqlerrm<>'INVALID_RECEIPT' then raise; end if; end;
 s:=public.ltm_edit_review('roules-cannelle-moelleux',r,5,'Testeur','Très bonne recette, résultat moelleux.',true,'','/9j/2Q==','replace');
 if s<>'pending' or exists(select 1 from public.ltm_reviews_with_photos('roules-cannelle-moelleux') where id=rid) then raise exception 'Photo edit public'; end if;
 s:=public.ltm_edit_review('roules-cannelle-moelleux',r,5,'Testeur','Très bonne recette, résultat moelleux.',true,'',null,'remove');
 if s<>'approved' or (select photo_jpeg is not null from public.recipe_reviews where id=rid) then raise exception 'Photo removal failed'; end if;
 begin
   perform public.ltm_edit_review('roules-cannelle-moelleux',r,4,'Testeur','Très bonne recette, résultat moelleux.',true);
   raise exception 'Edit cap bypassed';
 exception when raise_exception then if sqlerrm<>'EDIT_LIMIT' then raise; end if; end;
 -- Another declared person has a separate author/receipt, on the same recipe.
 perform public.ltm_submit_review_photo('roules-cannelle-moelleux',4,'TesteurDeux','Très bonne recette, résultat moelleux.',gen_random_uuid(),r2,true);
 if (select count(*) from public.recipe_reviews)<>n+2 then raise exception 'Second person missing'; end if;
 perform public.ltm_withdraw_review(r);
 begin
   perform public.ltm_edit_review('roules-cannelle-moelleux',r,4,'Testeur','Très bonne recette, résultat moelleux.',true);
   raise exception 'Withdrawn review revived';
 exception when raise_exception then if sqlerrm<>'INVALID_RECEIPT' then raise; end if; end;
 if (select status from public.recipe_reviews where receipt_hash=encode(sha256(convert_to(r2::text,'UTF8')),'hex'))<>'approved' then raise exception 'Other person affected'; end if;
end;
$$;
select 'EDIT_TESTS_OK (rolled back)' as result;
rollback;
