-- La Table Mijote: moderated reviews. Run only in project upjvynhezajrxnayqaaw.
begin;
create table public.recipe_review_targets (
 slug text primary key check (slug ~ '^[a-z0-9-]{1,120}$'),
 enabled boolean not null default true
);
create table public.recipe_reviews (
 id uuid primary key default gen_random_uuid(),
 recipe_slug text not null references public.recipe_review_targets(slug),
 rating smallint not null check (rating between 1 and 5),
 nickname text not null check (char_length(nickname) between 2 and 40),
 comment text not null check (char_length(comment) between 20 and 2000),
 status text not null default 'pending' check (status in ('pending','approved','rejected','withdrawn')),
 created_at timestamptz not null default now(),
 published_at timestamptz,
 moderation_reason text,
 author_hash text not null,
 receipt_hash text not null unique,
 consent_version text not null default '2026-10-15'
);
create index recipe_reviews_public_idx on public.recipe_reviews(recipe_slug, created_at desc) where status='approved';
create index recipe_reviews_created_idx on public.recipe_reviews(created_at);
create index recipe_reviews_author_idx on public.recipe_reviews(author_hash, created_at);
alter table public.recipe_review_targets enable row level security;
alter table public.recipe_reviews enable row level security;
revoke all on public.recipe_review_targets, public.recipe_reviews from public, anon, authenticated;
grant all on public.recipe_review_targets, public.recipe_reviews to service_role;
-- No anonymous table access. Only the narrowly scoped functions below.
create function public.ltm_review_summaries()
returns table(recipe_slug text, review_count bigint, average_rating numeric)
language sql stable security definer set search_path = ''
as $$
 select t.slug, count(r.id), round(avg(r.rating),1)
 from public.recipe_review_targets t
 left join public.recipe_reviews r on r.recipe_slug=t.slug and r.status='approved'
 where t.enabled group by t.slug;
$$;
create function public.ltm_reviews(p_slug text, p_offset integer default 0)
returns table(id uuid, nickname text, rating smallint, comment text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
 select r.id,r.nickname,r.rating,r.comment,r.created_at
 from public.recipe_reviews r join public.recipe_review_targets t on t.slug=r.recipe_slug
 where t.enabled and r.recipe_slug=p_slug and r.status='approved'
 order by r.created_at desc,r.id
 limit 10 offset greatest(0,least(coalesce(p_offset,0),10000));
$$;
create function public.ltm_submit_review(p_slug text,p_rating integer,p_nickname text,p_comment text,p_author uuid,p_receipt uuid,p_consent boolean,p_website text default '')
returns text language plpgsql security definer set search_path = ''
as $$
declare a text; rh text; old public.recipe_reviews%rowtype;
begin
 if p_consent is distinct from true or p_author is null or p_receipt is null
 or p_rating is null or p_rating not between 1 and 5
 or p_nickname is null or char_length(trim(p_nickname)) not between 2 and 40
 or p_comment is null or char_length(trim(p_comment)) not between 20 and 2000
 or coalesce(p_website,'') <> ''
 or p_nickname ~ '[<>@]' or p_comment ~* '(https?://|www[.]|<[^>]*>|[[:alnum:]._%+-]+@[[:alnum:].-]+[.][[:alpha:]]{2,})'
 then raise exception 'INVALID_REVIEW'; end if;
 if not exists(select 1 from public.recipe_review_targets where slug=p_slug and enabled) then raise exception 'UNKNOWN_RECIPE'; end if;
 a:=encode(sha256(convert_to(p_author::text,'UTF8')),'hex');
 rh:=encode(sha256(convert_to(p_receipt::text,'UTF8')),'hex');
 -- Serialize admission checks to prevent concurrent bypass of limits.
 perform pg_advisory_xact_lock(74216015);
 select * into old from public.recipe_reviews where receipt_hash=rh;
 if found then
   if old.author_hash<>a or old.recipe_slug<>p_slug then raise exception 'INVALID_RECEIPT'; end if;
   return old.status;
 end if;
 if exists(select 1 from public.recipe_reviews where author_hash=a and recipe_slug=p_slug and status in ('pending','approved'))
 then raise exception 'ALREADY_REVIEWED'; end if;
 if (select count(*) from public.recipe_reviews where author_hash=a and created_at>now()-interval '24 hours')>=3
 or (select count(*) from public.recipe_reviews where created_at>now()-interval '24 hours')>=50
 or (select count(*) from public.recipe_reviews where status='pending')>=200
 then raise exception 'REVIEW_LIMIT'; end if;
 insert into public.recipe_reviews(recipe_slug,rating,nickname,comment,author_hash,receipt_hash)
 values(p_slug,p_rating,trim(p_nickname),trim(p_comment),a,rh);
 return 'pending';
end;
$$;
create function public.ltm_withdraw_review(p_receipt uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
 update public.recipe_reviews set status='withdrawn',nickname='Retiré',comment='Avis retiré par son auteur',moderation_reason=null,published_at=null
 where receipt_hash=encode(sha256(convert_to(p_receipt::text,'UTF8')),'hex');
 return found;
end;
$$;
revoke all on function public.ltm_review_summaries(),public.ltm_reviews(text,integer),public.ltm_submit_review(text,integer,text,text,uuid,uuid,boolean,text),public.ltm_withdraw_review(uuid) from public,anon,authenticated;
grant execute on function public.ltm_review_summaries(),public.ltm_reviews(text,integer),public.ltm_submit_review(text,integer,text,text,uuid,uuid,boolean,text),public.ltm_withdraw_review(uuid) to anon,authenticated;
commit;

