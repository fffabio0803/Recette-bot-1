-- Isolated transaction: all synthetic rows are rolled back, never public.
begin;
do $$
declare a uuid:=gen_random_uuid(); receipt uuid:=gen_random_uuid(); result text; n bigint; rejected boolean:=false;
begin
 if (select count(*) from public.recipe_review_targets)<>64 then raise exception 'TARGET_COUNT'; end if;
 if has_table_privilege('anon','public.recipe_reviews','SELECT') or has_table_privilege('anon','public.recipe_reviews','INSERT') or has_table_privilege('anon','public.recipe_reviews','UPDATE') or has_table_privilege('anon','public.recipe_reviews','DELETE') then raise exception 'TABLE_EXPOSED'; end if;
 if not (select relrowsecurity from pg_class where oid='public.recipe_reviews'::regclass) then raise exception 'RLS_OFF'; end if;
 result:=public.ltm_submit_review('roules-cannelle-moelleux',4,'TEST TECHNIQUE','Ceci est uniquement un essai technique temporaire.',a,receipt,true,'');
 if result<>'pending' then raise exception 'NOT_PENDING'; end if;
 select review_count into n from public.ltm_review_summaries() where recipe_slug='roules-cannelle-moelleux';
 if n<>0 then raise exception 'PENDING_EXPOSED'; end if;
 if exists(select 1 from public.ltm_reviews('roules-cannelle-moelleux',0)) then raise exception 'PENDING_TEXT_EXPOSED'; end if;
 result:=public.ltm_submit_review('roules-cannelle-moelleux',4,'TEST TECHNIQUE','Ceci est uniquement un essai technique temporaire.',a,receipt,true,'');
 if (select count(*) from public.recipe_reviews)<>1 then raise exception 'DUPLICATE_CREATED'; end if;
 begin
 perform public.ltm_submit_review('roules-cannelle-moelleux',6,'TEST','Commentaire invalide de test technique.',gen_random_uuid(),gen_random_uuid(),true,'');
 exception when others then rejected:=sqlerrm='INVALID_REVIEW'; end;
 if not rejected then raise exception 'BAD_RATING_ACCEPTED'; end if;
 rejected:=false;
 begin
 perform public.ltm_submit_review('roules-cannelle-moelleux',3,'TEST','Second commentaire du même navigateur.',a,gen_random_uuid(),true,'');
 exception when others then rejected:=sqlerrm='ALREADY_REVIEWED'; end;
 if not rejected then raise exception 'DUPLICATE_ACCEPTED'; end if;
 update public.recipe_reviews set status='approved',published_at=now() where receipt_hash=encode(sha256(convert_to(receipt::text,'UTF8')),'hex');
 select review_count into n from public.ltm_review_summaries() where recipe_slug='roules-cannelle-moelleux';
 if n<>1 or (select average_rating from public.ltm_review_summaries() where recipe_slug='roules-cannelle-moelleux')<>4 then raise exception 'AGGREGATE_INCORRECT'; end if;
 if public.ltm_withdraw_review(gen_random_uuid()) then raise exception 'WRONG_RECEIPT_ACCEPTED'; end if;
 if not public.ltm_withdraw_review(receipt) then raise exception 'WITHDRAW_FAILED'; end if;
 if exists(select 1 from public.ltm_reviews('roules-cannelle-moelleux',0)) then raise exception 'WITHDRAW_STILL_VISIBLE'; end if;
end $$;
set local role anon;
select count(*) as public_target_count from public.ltm_review_summaries();
rollback;
select count(*) as real_reviews_after_test from public.recipe_reviews;

