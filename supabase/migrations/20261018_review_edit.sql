-- Author-requested editing by private receipt; does not update any existing review on installation.
begin;
alter table public.recipe_reviews add column edited_at timestamptz,
 add column edit_window timestamptz, add column edit_count integer not null default 0;
create function public.ltm_edit_review(p_slug text,p_receipt uuid,p_rating integer,p_nickname text,p_comment text,p_consent boolean,p_website text default '',p_photo text default null,p_photo_mode text default 'keep')
returns text language plpgsql security definer set search_path = '' as $$
declare old public.recipe_reviews%rowtype; photo bytea; next_status text; edits integer;
begin
 perform pg_advisory_xact_lock(74216015);
 select * into old from public.recipe_reviews where receipt_hash=encode(sha256(convert_to(p_receipt::text,'UTF8')),'hex') and recipe_slug=p_slug for update;
 if not found or old.status='withdrawn' then raise exception 'INVALID_RECEIPT'; end if;
 if not exists(select 1 from public.recipe_review_targets where slug=p_slug and enabled) then raise exception 'UNKNOWN_RECIPE'; end if;
 if p_consent is distinct from true or p_rating is null or p_rating not between 1 and 5
 or p_nickname is null or char_length(trim(p_nickname)) not between 2 and 40
 or p_comment is null or char_length(trim(p_comment)) not between 20 and 2000
 or coalesce(p_website,'')<>'' or p_nickname ~ '[<>@]'
 or p_comment ~* '(https?://|www[.]|<[^>]*>|[[:alnum:]._%+-]+@[[:alnum:].-]+[.][[:alpha:]]{2,})'
 then raise exception 'INVALID_REVIEW'; end if;
 if p_photo_mode is null or p_photo_mode not in ('keep','remove','replace') then raise exception 'INVALID_PHOTO'; end if;
 photo:=case when p_photo_mode='keep' then old.photo_jpeg else null end;
 if p_photo_mode='replace' then
   if p_photo is null or char_length(p_photo)>136536 or p_photo !~ '^[A-Za-z0-9+/]+={0,2}$' then raise exception 'INVALID_PHOTO'; end if;
   begin photo:=decode(p_photo,'base64'); exception when others then raise exception 'INVALID_PHOTO'; end;
   if octet_length(photo) not between 4 and 102400 or substring(photo from 1 for 3)<>decode('ffd8ff','hex') or substring(photo from octet_length(photo)-1 for 2)<>decode('ffd9','hex') then raise exception 'INVALID_PHOTO'; end if;
   if (select coalesce(sum(octet_length(photo_jpeg)),0) from public.recipe_reviews where id<>old.id)+octet_length(photo)>20971520 then raise exception 'PHOTO_LIMIT'; end if;
 elsif p_photo is not null then raise exception 'INVALID_PHOTO'; end if;
 -- Identical retries preserve manual moderation and do not consume the edit allowance.
 if old.rating=p_rating and old.nickname=trim(p_nickname) and old.comment=trim(p_comment) and old.photo_jpeg is not distinct from photo then return old.status; end if;
 edits:=case when old.edit_window>now()-interval '24 hours' then old.edit_count else 0 end;
 if edits>=3 or (select count(*) from public.recipe_reviews where edited_at>now()-interval '24 hours')>=100 then raise exception 'EDIT_LIMIT'; end if;
 next_status:='pending';
 if old.status<>'rejected' and photo is null and public.ltm_review_text_safe(trim(p_nickname),trim(p_comment)) then next_status:='approved'; end if;
 if next_status='pending' and old.status<>'pending' and (select count(*) from public.recipe_reviews where status='pending')>=200 then raise exception 'REVIEW_LIMIT'; end if;
 update public.recipe_reviews set nickname=trim(p_nickname),comment=trim(p_comment),rating=p_rating,photo_jpeg=photo,status=next_status,
 published_at=case when next_status='approved' then now() else null end,
 moderation_reason=case when next_status='approved' then 'auto-text-v1-edit' else 'edited-awaiting-review' end,
 edited_at=now(),edit_count=edits+1,edit_window=case when edits=0 then now() else old.edit_window end,
 consent_version='2026-10-18-edit' where id=old.id;
 return next_status;
end;
$$;
revoke all on function public.ltm_edit_review(text,uuid,integer,text,text,boolean,text,text,text) from public,anon,authenticated;
grant execute on function public.ltm_edit_review(text,uuid,integer,text,text,boolean,text,text,text) to anon,authenticated;
commit;
