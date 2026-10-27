(function () {
  'use strict';

  // Auto ads are OFF in AdSense. No ad units or ad requests are created here.
  // The official tag loads the existing published Google consent message.
  // Analytics remains independently opt-in through analytics-consent.js.
  if (document.getElementById('ltm-advertising-settings')) return;
  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  var ready = false;
  var area = document.createElement('div');
  area.id = 'ltm-advertising-settings';
  area.style.cssText = 'text-align:center;padding:16px;font:14px/1.5 system-ui,sans-serif';
  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Confidentialité publicitaire';
  button.style.cssText = 'font:inherit;color:inherit;background:transparent;border:1px solid currentColor;border-radius:6px;padding:8px 12px;cursor:pointer';
  var status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.hidden = true;
  area.appendChild(button);
  area.appendChild(status);
  (document.querySelector('footer') || document.body).appendChild(area);

  window.googlefc.callbackQueue.push({ CONSENT_API_READY: function () {
    ready = true;
    status.hidden = true;
  }});
  button.addEventListener('click', function () {
    if (!ready || typeof window.googlefc.showRevocationMessage !== 'function') {
      status.textContent = 'Le gestionnaire publicitaire Google n’est pas disponible pour cette visite. Aucune annonce n’est activée sur le site. Le choix Analytics reste accessible via « Gérer mes cookies ».';
      status.hidden = false;
      return;
    }
    window.googlefc.callbackQueue.push(function () {
      window.googlefc.showRevocationMessage();
    });
  });

  if (!document.querySelector('script[data-ltm-adsense]')) {
    var script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4732923807982186';
    script.dataset.ltmAdsense = 'true';
    document.head.appendChild(script);
  }
})();
