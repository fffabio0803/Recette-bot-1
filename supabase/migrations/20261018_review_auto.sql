-- Conservative automatic publication, no paid AI and no retroactive approval.
begin;
create function public.ltm_review_text_safe(n text, c text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare words text[]; w text;
begin
 if n is null or c is null or char_length(c)>600
 or n !~ '^[A-Za-zÀ-ÖØ-öø-ÿ]{2,24}$'
 or lower(n) ~ '(merde|connard|connasse|putain|salope|fuck|nazi|hitler|pute|conne|cul|bite|sex)'
 or c !~ '^[A-Za-zÀ-ÖØ-öø-ÿœŒ .,!?;:''’\n\r-]+$' then return false; end if;
 words:=regexp_split_to_array(lower(c),'[^a-zà-öø-ÿœ]+');
 foreach w in array words loop
   if w<>'' and not(w=any(string_to_array('a à ai aime aimé aimée aimé avons avec au aux aussi assez aucun aucune beaucoup bien bon bonne bonnes bons beurre cannelle ce ces cette chocolat cuisson cuit cuite cuits cuites crème dans de des du délicieux délicieuse délicieuses déçue déçu dense difficile dosage dosé dosée doux eau elle en encore est et été facile faciles farine fait faite faites faits faut ferme four goût garniture gâteau glaçage goût goûteux goûteuse huile il ils j je la lait le les leur levée levure léger légère mais mal manque manquait me merci mes miel minutes moins moelleux moelleuse mon moule mousse ne ni non nos nous oeufs œufs on ou oui pain par pas pâte peu plus pour préparation préparé préparée première plutôt qu que quel quelle recette recommande résultat repos réussi réussie roulés sans sec sèche sèches secs seconde sel si simple sont souple sous sucre sucré sucrée super texture temps très trop un une utilisé utilisée va vraiment votre vos y c était n l d s bien doré dorée croustillant croustillante raté ratée fade fades amer amère dur dure épais épaisse liquide longue long rapide lent lente chaud chaude froid froide collante collant levé levés gonflé gonflés pas assez tout tout simplement excellent excellente parfait parfaite mangé mangée famille refaire referai aimé adoré adorée proportion proportions ingrédients moitié fourchette fournée régal pâteux pâteuse salé salée froids tiède centre dessus dessous goût goûtées goûté goûtée juteux juteuse brûlé brûlée',' '))) then return false; end if;
 end loop;
 return true;
end;
$$;
revoke all on function public.ltm_review_text_safe(text,text) from public,anon,authenticated;

alter function public.ltm_submit_review_photo(text,integer,text,text,uuid,uuid,boolean,text,text) rename to ltm_submit_review_photo_checked;
revoke all on function public.ltm_submit_review_photo_checked(text,integer,text,text,uuid,uuid,boolean,text,text) from public,anon,authenticated;
create function public.ltm_submit_review_photo(p_slug text,p_rating integer,p_nickname text,p_comment text,p_author uuid,p_receipt uuid,p_consent boolean,p_website text default '',p_photo text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare existed boolean; result text; rh text;
begin
 perform pg_advisory_xact_lock(74216015);
 rh:=encode(sha256(convert_to(p_receipt::text,'UTF8')),'hex');
 select exists(select 1 from public.recipe_reviews where receipt_hash=rh) into existed;
 result:=public.ltm_submit_review_photo_checked(p_slug,p_rating,p_nickname,p_comment,p_author,p_receipt,p_consent,p_website,p_photo);
 if not existed and result='pending' and p_photo is null and public.ltm_review_text_safe(trim(p_nickname),trim(p_comment)) then
   update public.recipe_reviews set status='approved',published_at=now(),moderation_reason='auto-text-v1',consent_version='2026-10-18-auto'
   where receipt_hash=rh and status='pending' and photo_jpeg is null;
   if found then result:='approved'; end if;
 end if;
 return result;
end;
$$;
revoke all on function public.ltm_submit_review_photo(text,integer,text,text,uuid,uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.ltm_submit_review_photo(text,integer,text,text,uuid,uuid,boolean,text,text) to anon,authenticated;
commit;
