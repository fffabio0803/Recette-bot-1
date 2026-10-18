begin;
do $$
declare a uuid:=gen_random_uuid(); r uuid:=gen_random_uuid(); r2 uuid:=gen_random_uuid(); rid uuid; s text;
begin
 s:=public.ltm_submit_review_photo('roules-cannelle-moelleux',4,'Test transaction','Essai technique temporaire à annuler.',a,r,true,'','/9j/2Q==');
 if s<>'pending' then raise exception 'Pending failed'; end if;
 select id into rid from public.recipe_reviews where receipt_hash=encode(sha256(convert_to(r::text,'UTF8')),'hex');
 if exists(select 1 from public.ltm_reviews_with_photos('roules-cannelle-moelleux',0) where id=rid) then raise exception 'Private photo leaked'; end if;
 s:=public.ltm_submit_review_photo('roules-cannelle-moelleux',4,'Test transaction','Essai technique temporaire à annuler.',a,r,true,'','bad');
 if s<>'pending' then raise exception 'Retry failed'; end if;
 update public.recipe_reviews set status='approved',published_at=now() where id=rid;
 if not exists(select 1 from public.ltm_reviews_with_photos('roules-cannelle-moelleux',0) where id=rid and photo='/9j/2Q==') then raise exception 'Published photo missing'; end if;
 if not public.ltm_withdraw_review(r) then raise exception 'Withdrawal failed'; end if;
 if exists(select 1 from public.recipe_reviews where id=rid and photo_jpeg is not null) then raise exception 'Photo not cleared'; end if;
 begin
   perform public.ltm_submit_review_photo('roules-cannelle-moelleux',4,'Test transaction','Essai technique temporaire à annuler.',a,r2,true,'','PHN2Zz4=');
   raise exception 'Invalid photo accepted';
 exception when raise_exception then
   if sqlerrm<>'INVALID_PHOTO' then raise; end if;
 end;
 begin
   perform public.ltm_submit_review_photo('roules-cannelle-moelleux',4,'Test transaction','Essai technique temporaire à annuler.',a,r2,true,'',repeat('A',136540));
   raise exception 'Oversize accepted';
 exception when raise_exception then
   if sqlerrm<>'INVALID_PHOTO' then raise; end if;
 end;
 if has_table_privilege('anon','public.recipe_reviews','SELECT') then raise exception 'Direct table readable'; end if;
 perform public.ltm_submit_review_photo('roules-cannelle-moelleux',4,'Test transaction','Essai technique temporaire à annuler.',a,r2,true,'','/9j/2Q==');
 update public.recipe_reviews set status='rejected' where receipt_hash=encode(sha256(convert_to(r2::text,'UTF8')),'hex');
 if exists(select 1 from public.recipe_reviews where receipt_hash=encode(sha256(convert_to(r2::text,'UTF8')),'hex') and photo_jpeg is not null) then raise exception 'Rejected photo retained'; end if;
end;
$$;
select 'PHOTO_TESTS_OK (transaction rolled back)' as result;
rollback;
