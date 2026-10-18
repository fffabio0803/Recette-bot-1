-- Apply only to La Table Mijote (upjvynhezajrxnayqaaw).
-- Small private JPEGs, bounded total storage, same moderation and withdrawal.
begin;
alter table public.recipe_reviews add column photo_jpeg bytea
 check (photo_jpeg is null or octet_length(photo_jpeg) <= 102400);

create function public.ltm_submit_review_photo(p_slug text,p_rating integer,p_nickname text,p_comment text,p_author uuid,p_receipt uuid,p_consent boolean,p_website text default '',p_photo text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare result text; photo bytea; existing boolean;
begin
 perform pg_advisory_xact_lock(74216015);
 select exists(select 1 from public.recipe_reviews where receipt_hash=encode(sha256(convert_to(p_receipt::text,'UTF8')),'hex')) into existing;
 -- Original function retains all validation, idempotency and admission limits.
 if not existing and p_photo is not null then
   if char_length(p_photo)>136536 or p_photo !~ '^[A-Za-z0-9+/]+={0,2}$' then raise exception 'INVALID_PHOTO'; end if;
   begin photo:=decode(p_photo,'base64'); exception when others then raise exception 'INVALID_PHOTO'; end;
   if octet_length(photo) not between 4 and 102400 or substring(photo from 1 for 3)<>decode('ffd8ff','hex')
      or substring(photo from octet_length(photo)-1 for 2)<>decode('ffd9','hex') then raise exception 'INVALID_PHOTO'; end if;
   if (select coalesce(sum(octet_length(photo_jpeg)),0) from public.recipe_reviews)+octet_length(photo)>20971520
      then raise exception 'PHOTO_LIMIT'; end if;
 end if;
 result:=public.ltm_submit_review(p_slug,p_rating,p_nickname,p_comment,p_author,p_receipt,p_consent,p_website);
 if not existing then
   update public.recipe_reviews set photo_jpeg=photo,consent_version='2026-10-18'
   where receipt_hash=encode(sha256(convert_to(p_receipt::text,'UTF8')),'hex');
 end if;
 return result;
end;
$$;

create function public.ltm_reviews_with_photos(p_slug text,p_offset integer default 0)
returns table(id uuid,nickname text,rating smallint,comment text,created_at timestamptz,photo text)
language sql stable security definer set search_path = '' as $$
 select r.id,r.nickname,r.rating,r.comment,r.created_at,
 case when r.photo_jpeg is null then null else replace(encode(r.photo_jpeg,'base64'),chr(10),'') end
 from public.recipe_reviews r join public.recipe_review_targets t on t.slug=r.recipe_slug
 where t.enabled and r.recipe_slug=p_slug and r.status='approved'
 order by r.created_at desc,r.id limit 10 offset greatest(0,least(coalesce(p_offset,0),10000));
$$;

create function public.ltm_clear_review_photo() returns trigger
language plpgsql set search_path = '' as $$
begin
 if new.status in ('withdrawn','rejected') then new.photo_jpeg:=null; end if;
 return new;
end;
$$;
create trigger ltm_clear_review_photo before insert or update on public.recipe_reviews
 for each row execute function public.ltm_clear_review_photo();
revoke all on function public.ltm_submit_review_photo(text,integer,text,text,uuid,uuid,boolean,text,text),public.ltm_reviews_with_photos(text,integer),public.ltm_clear_review_photo() from public,anon,authenticated;
grant execute on function public.ltm_submit_review_photo(text,integer,text,text,uuid,uuid,boolean,text,text),public.ltm_reviews_with_photos(text,integer) to anon,authenticated;
commit;
