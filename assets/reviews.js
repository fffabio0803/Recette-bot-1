/* Public key only. Privileged operations stay in Supabase. */
(() => {
  'use strict';
  const API = 'https://upjvynhezajrxnayqaaw.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_Xaz5k6D7-29kw0hpSyd1zg_YWmI6TcH';
  const STORE = 'ltm_reviews_v1';
  const match = location.pathname.match(/^\/recettes\/([a-z0-9-]+)\.html$/);
  const slug = match && match[1];
  let summaries = null;
  let busy = false;
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const uuid = s => typeof s === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(s);
  function saved() {
    try {
      const value = JSON.parse(localStorage.getItem(STORE) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }
  function persist(value) {
    try { localStorage.setItem(STORE, JSON.stringify(value)); return true; } catch { return false; }
  }
  async function rpc(name, data = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(API + name, {
        method: 'POST', headers: {'apikey': KEY, 'Content-Type': 'application/json'},
        body: JSON.stringify(data), signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'SERVICE_UNAVAILABLE');
      return result;
    } finally { clearTimeout(timer); }
  }
  async function preparePhoto(file) {
    if (!file) return null;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error('INVALID_PHOTO');
    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 48000000) throw new Error('INVALID_PHOTO');
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      // Re-encoding removes source EXIF (including location) and animation.
      for (const quality of [0.8,0.65,0.5,0.35]) {
        const data = canvas.toDataURL('image/jpeg',quality).split(',')[1];
        if (data && atob(data).length <= 102400) return data;
      }
      throw new Error('INVALID_PHOTO');
    } finally { bitmap.close(); }
  }
  function summaryText(item) {
    if (!item || !Number.isFinite(Number(item.review_count))) return 'Avis indisponibles';
    const count = Number(item.review_count);
    if (!count) return 'Pas encore d’avis';
    const average = Number(item.average_rating);
    if (average < 1 || average > 5) return 'Avis indisponibles';
    return '★ ' + average.toLocaleString('fr-FR', {maximumFractionDigits:1}) + '/5 · ' + count + ' avis';
  }
  function decorateCards() {
    if (!summaries) return;
    document.querySelectorAll('.recipe-card,.latest-item,#hero-content').forEach(card => {
      const link = card.querySelector('a[href*="recettes/"]');
      if (!link) return;
      const found = new URL(link.href).pathname.match(/\/recettes\/([a-z0-9-]+)\.html$/);
      if (!found) return;
      let badge = card.querySelector('.ltm-card-rating');
      if (!badge) {
        badge = el('p', '', 'ltm-card-rating');
        const title = card.querySelector('.card-title,.recipe-title,.latest-title,#hero-title');
        if (title) title.after(badge); else link.append(badge);
      }
      const text = summaryText(summaries.find(r => r.recipe_slug === found[1]));
      if (badge.textContent !== text) badge.textContent = text;
    });
  }
  async function refreshSummaries() {
    const result = await rpc('ltm_review_summaries');
    if (!Array.isArray(result)) throw new Error('INVALID_RESPONSE');
    summaries = result;
    decorateCards();
    return summaries.find(r => r.recipe_slug === slug);
  }
  function addForm(section) {
    const form = el('form');
    form.className = 'ltm-review-form';
    const title = el('h3', 'Vous avez cuisiné cette recette ?');
    const intro = el('p', 'Partagez votre résultat, les adaptations et les difficultés rencontrées. Votre avis sera relu avant publication, quelle que soit sa note.');
    form.append(title, intro);
    const fieldset = el('fieldset');
    fieldset.append(el('legend', 'Votre note (obligatoire)'));
    const stars = el('div', undefined, 'ltm-stars');
    for (let i=1;i<=5;i++) {
      const label = el('label');
      const input = el('input'); input.type='radio'; input.name='rating'; input.value=String(i); input.required=true;
      const mark=el('span','★'); mark.setAttribute('aria-hidden','true');
      const sr=el('span',i + (i===1?' étoile':' étoiles'),'ltm-sr');
      label.append(input,mark,sr); stars.append(label);
    }
    const choice=el('p','Choisissez de 1 à 5 étoiles.');
    stars.addEventListener('change',()=>{
      const selected=Number(stars.querySelector('input:checked')?.value);
      stars.querySelectorAll('label').forEach((label,index)=>label.classList.toggle('ltm-selected',index<selected));
      choice.textContent='Votre note : '+selected+'/5';
    });
    fieldset.append(stars,choice);
    const nameLabel=el('label','Pseudonyme public (2 à 40 caractères)');
    const name=el('input'); name.name='nickname'; name.required=true; name.minLength=2; name.maxLength=40; name.autocomplete='off'; nameLabel.append(name);
    const commentLabel=el('label','Votre avis (20 à 2 000 caractères)');
    const comment=el('textarea'); comment.name='comment'; comment.required=true; comment.minLength=20; comment.maxLength=2000; comment.rows=5; commentLabel.append(comment);
    const photoLabel=el('label','Photo de votre réalisation (facultatif)');
    const photoInput=el('input'); photoInput.type='file'; photoInput.accept='image/jpeg,image/png,image/webp'; photoInput.name='photo'; photoLabel.append(photoInput);
    const photoHelp=el('p','Une photo JPG, PNG ou WebP, 8 Mo maximum. Elle sera réduite avant envoi et publiée seulement après modération. Photographiez uniquement votre plat, sans visage, document ni coordonnées.');
    const preview=el('img'); preview.alt='Aperçu de votre photo avant envoi'; preview.hidden=true; preview.style.cssText='max-width:100%;max-height:240px;object-fit:contain';
    const photoStatus=el('p'); photoStatus.setAttribute('role','status');
    const removePhoto=el('button','Retirer la photo'); removePhoto.type='button'; removePhoto.hidden=true;
    let photoData=null, photoPending=false, photoSequence=0;
    function clearPhoto(){photoSequence++;photoInput.value='';photoData=null;photoPending=false;preview.removeAttribute('src');preview.hidden=true;removePhoto.hidden=true;photoStatus.textContent='';photoInput.setCustomValidity('');}
    removePhoto.addEventListener('click',clearPhoto);
    photoInput.addEventListener('change',async()=>{
      const sequence=++photoSequence; photoPending=true;photoData=null;preview.hidden=true;photoInput.setCustomValidity('');removePhoto.hidden=false;
      photoStatus.textContent='Préparation de la photo…';
      try {
        const data=await preparePhoto(photoInput.files[0]);
        if(sequence!==photoSequence)return;
        photoData=data;
        if(data){preview.src='data:image/jpeg;base64,'+data;preview.hidden=false;photoStatus.textContent='Photo prête. Vérifiez l’aperçu avant d’envoyer.';}
        else clearPhoto();
      } catch {
        if(sequence!==photoSequence)return;
        photoInput.setCustomValidity('Choisissez une autre photo ou retirez-la.');
        photoStatus.textContent='Photo non prise en charge ou trop grande. Essayez un JPG plus petit, ou retirez la photo pour envoyer le texte seul.';
      } finally {if(sequence===photoSequence)photoPending=false;}
    });
    const trapLabel=el('label','Laissez ce champ vide','ltm-trap');
    trapLabel.setAttribute('aria-hidden','true');
    const trap=el('input'); trap.name='website'; trap.tabIndex=-1; trap.autocomplete='off'; trapLabel.append(trap);
    const consentLabel=el('label',undefined,'ltm-consent');
    const consent=el('input'); consent.type='checkbox'; consent.required=true; consent.name='consent';
    consentLabel.append(consent,document.createTextNode('J’ai réalisé cette recette et j’accepte la publication de mon pseudonyme, de ma note, de mon commentaire et de ma photo éventuelle. Je suis l’auteur de la photo et j’autorise son affichage avec mon avis. Aucun e-mail, lien ou renseignement personnel dans mon avis ou ma photo.'));
    const privacy=el('a','Confidentialité et retrait de mon avis'); privacy.href='/confidentialite.html#avis';
    const send=el('button','Envoyer mon avis'); send.type='submit';
    const message=el('p','', 'ltm-review-status'); message.setAttribute('role','status'); message.setAttribute('aria-live','polite');
    const receiptArea=el('div',undefined,'ltm-receipt');
    form.append(fieldset,nameLabel,commentLabel,photoLabel,photoHelp,preview,photoStatus,removePhoto,trapLabel,consentLabel,privacy,send,message,receiptArea);
    section.append(form);
    let receipt = saved().receipts?.[slug];
    let author = saved().author;
    if (!uuid(receipt)) receipt=null;
    function showReceipt(code) {
      receiptArea.replaceChildren();
      receiptArea.append(el('p','Code de retrait privé : conservez-le, notamment si votre navigateur efface ses données. Ne le publiez pas.'));
      const output=el('input'); output.readOnly=true; output.value=code; output.setAttribute('aria-label','Code de retrait privé'); receiptArea.append(output);
    }
    if (receipt) {
      showReceipt(receipt);
      message.textContent='Un envoi précédent est mémorisé sur ce navigateur. Son statut public dépend de la modération.';
    }
    form.addEventListener('submit',async event => {
      event.preventDefault();
      if (photoPending) {message.textContent='Attendez la préparation de la photo.';return;}
      if (busy || !form.reportValidity()) return;
      busy=true; send.disabled=true; message.textContent='Envoi en cours…';
      try {
        if (!uuid(author)) author=crypto.randomUUID();
        if (!receipt) receipt=crypto.randomUUID();
        const data=saved(); data.author=author; data.receipts={...data.receipts,[slug]:receipt};
        const stored=persist(data);
        showReceipt(receipt);
        const result=await rpc('ltm_submit_review_photo',{
          p_slug:slug,p_rating:Number(new FormData(form).get('rating')),
          p_nickname:name.value.trim(),p_comment:comment.value.trim(),
          p_author:author,p_receipt:receipt,p_consent:consent.checked,p_website:trap.value,p_photo:photoData
        });
        if (!['pending','approved','rejected','withdrawn'].includes(result)) throw new Error('INVALID_RESPONSE');
        const messages={
          pending:'Merci ! Votre avis est enregistré et attend la modération. Il ne compte pas encore dans la moyenne.',
          approved:'Cet avis a déjà été reçu et publié. Aucun doublon ajouté.',
          rejected:'Cet envoi a déjà été examiné et n’a pas été publié. Contactez-nous avec sa référence publique si nécessaire.',
          withdrawn:'Cet envoi a déjà été retiré. Rechargez la page avant un nouvel envoi.'
        };
        message.textContent=messages[result]+(!stored?' Le stockage local est indisponible : copiez votre code de retrait.':'');
        if(result==='pending'||result==='approved') {name.value='';comment.value='';consent.checked=false;clearPhoto();}
      } catch(error) {
        const errors={
          INVALID_REVIEW:'Vérifiez votre note, le pseudonyme, le commentaire et votre accord. Les liens, e-mails et balises ne sont pas acceptés.',
          INVALID_PHOTO:'La photo a été refusée. Choisissez un JPG plus petit ou retirez-la pour envoyer votre texte seul.',
          PHOTO_LIMIT:'Le dépôt de photos est temporairement plein. Retirez la photo pour envoyer votre texte seul.',
          UNKNOWN_RECIPE:'Les avis ne sont pas disponibles pour cette recette.',
          ALREADY_REVIEWED:'Un avis de ce navigateur existe déjà pour cette recette. Retirez-le avant d’en envoyer un autre.',
          REVIEW_LIMIT:'La limite temporaire d’envoi est atteinte. Réessayez plus tard.'
        };
        message.textContent=errors[error.message]||'Envoi non confirmé. Votre texte reste ici : réessayez sans fermer la page. Un nouvel essai ne créera pas de doublon.';
      } finally {busy=false;send.disabled=false;}
    });
    const details=el('details'); details.append(el('summary','Retirer mon avis'));
    const withdrawal=el('form'); const label=el('label','Code de retrait privé');
    const code=el('input'); code.required=true; code.autocomplete='off'; code.value=receipt||''; label.append(code);
    const agree=el('label',undefined,'ltm-consent'); const check=el('input'); check.type='checkbox'; check.required=true;
    agree.append(check,document.createTextNode('Je confirme le retrait de ma note, de mon commentaire et de ma photo éventuelle.'));
    const button=el('button','Retirer cet avis'); button.type='submit';
    const status=el('p'); status.setAttribute('role','status');
    withdrawal.append(label,agree,button,status); details.append(withdrawal); section.append(details);
    details.addEventListener('toggle',()=>{if(details.open && receipt && !code.value)code.value=receipt;});
    withdrawal.addEventListener('submit',async event=>{
      event.preventDefault(); if(!withdrawal.reportValidity()||button.disabled)return;
      if(!uuid(code.value.trim())){status.textContent='Code de retrait invalide.';return;}
      button.disabled=true;
      try {
        const ok=await rpc('ltm_withdraw_review',{p_receipt:code.value.trim()});
        if(ok!==true){status.textContent='Aucun avis associé à ce code.';return;}
        const data=saved();
        if(data.receipts?.[slug]===code.value.trim()){delete data.receipts[slug];persist(data);}
        if(receipt===code.value.trim()){receipt=null;receiptArea.replaceChildren();}
        status.textContent='Avis retiré. Sa note, son commentaire et sa photo éventuelle ne sont plus publics.';
        await refreshPage();
      }catch{status.textContent='Retrait non confirmé : réessayez plus tard.';}
      finally{button.disabled=false;}
    });
  }
  let section,summary,list,more,offset=0;
  async function loadReviews(reset=false) {
    if(!list)return;
    if(reset){offset=0;list.replaceChildren();}
    more.disabled=true;
    try {
      const rows=await rpc('ltm_reviews_with_photos',{p_slug:slug,p_offset:offset});
      if(!Array.isArray(rows))throw new Error('INVALID_RESPONSE');
      rows.forEach(row=>{
        const article=el('article',undefined,'ltm-review');
        const when=new Date(row.created_at).toLocaleDateString('fr-FR');
        article.append(el('h3',row.nickname+' · '+row.rating+'/5'),el('p','Avis déposé le '+when),el('p',row.comment,'ltm-review-comment'));
        if(typeof row.photo==='string' && row.photo.length<=136536 && /^[A-Za-z0-9+/]+={0,2}$/.test(row.photo)) {
          const photo=el('img');photo.src='data:image/jpeg;base64,'+row.photo;photo.alt='Réalisation partagée par '+row.nickname;photo.loading='lazy';photo.style.cssText='display:block;max-width:100%;max-height:480px;object-fit:contain';article.append(photo);
        }
        list.append(article);
      });
      offset+=rows.length; more.hidden=rows.length<10;
    }catch{
      const error=el('p','Les commentaires n’ont pas pu être chargés. Réessayez.');
      list.append(error); more.hidden=false;
    }finally{more.disabled=false;}
  }
  async function refreshPage() {
    try {
      const item=await refreshSummaries();
      if(summary)summary.textContent=summaryText(item);
      const jump=document.querySelector('.ltm-review-jump');
      if(jump)jump.textContent=summaryText(item)+' · Donner mon avis';
      await loadReviews(true);
    }catch{if(summary)summary.textContent='Avis momentanément indisponibles — aucune note affichée.';}
  }
  if(slug && document.getElementById('avis')) {
    section=document.getElementById('avis');
    summary=el('p','Chargement des avis…','ltm-rating-summary'); summary.setAttribute('role','status');
    list=el('div'); list.className='ltm-review-list';
    more=el('button','Charger les avis'); more.type='button'; more.hidden=true;
    more.addEventListener('click',()=>loadReviews());
    section.append(summary,list,more);
    addForm(section);
    const top=el('a','Lire les avis ou donner mon avis','ltm-review-jump'); top.href='#avis';
    document.querySelector('h1')?.after(top);
  }
  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;decorateCards();});
  }).observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
  refreshPage();
})();

