-- Replace the vocabulary allowlist; keep existing validation, quotas and photo review.
begin;
create or replace function public.ltm_review_text_safe(n text, c text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare t text; compact text;
begin
 if n is null or c is null or char_length(trim(n)) not between 2 and 40
 or char_length(trim(c)) not between 20 and 2000 then return false; end if;
 t:=lower(n||' '||c);
 -- Links, email, phone-like strings, markup and obvious commercial solicitation.
 if t ~ '(https?://|www\.|@|[<>]|[[:alnum:]-]+\.(fr|com|net|org|io|xyz|ru|co|me|info)\M)'
 or t ~ '([0-9][ .()+-]*){8,}'
 or t ~ '(code promo|gagnez de l.argent|casino|crypto|contactez.moi|contacte.moi|whatsapp|telegram)'
 then return false; end if;
 t:=translate(t,'àâäéèêëîïôöùûüç','aaaeeeeiioouuuc');
 if t ~ '\m(merde|putain|pute[s]?|connard[s]?|connasse[s]?|con[s]?|conne[s]?|salope[s]?|salopard[s]?|encule[s]?|fdp|ntm|nique|fuck|shit|bitch|nazi[s]?|hitler|negre[s]?|bougnoule[s]?|youpin[s]?|pede[s]?)\M'
 then return false; end if;
 compact:=regexp_replace(translate(t,'013@$','oieas'),'[^a-z]','','g');
 if compact ~ '(connard|connasse|salope|encule|fuck|bougnoule|heilhitler|mortaux)' then return false; end if;
 return true;
end;
$$;
revoke all on function public.ltm_review_text_safe(text,text) from public,anon,authenticated;
commit;
