(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-RD4N5W9HP7';
  var STORAGE_KEY = 'ltm_analytics_consent_v1';
  var DISABLE_KEY = 'ga-disable-' + MEASUREMENT_ID;
  window[DISABLE_KEY] = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  function loadAnalytics() {
    window[DISABLE_KEY] = false;
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    if (document.querySelector('script[data-ltm-analytics]')) return;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    script.dataset.ltmAnalytics = 'true';
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function removeBanner() {
    var banner = document.getElementById('ltm-cookie-banner');
    if (banner) banner.remove();
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch (error) {
      // Le choix reste valable pour la page courante si le stockage est bloqué.
    }
    removeBanner();
    if (choice === 'accepted') {
      loadAnalytics();
    } else {
      window[DISABLE_KEY] = true;
      window.gtag('consent', 'update', {
        analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied'
      });
      // Retirer les cookies GA du domaine courant et du domaine parent.
      document.cookie.split(';').forEach(function (cookie) {
        var name = cookie.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) return;
        var expiry = name + '=; Max-Age=0; path=/; SameSite=Lax';
        document.cookie = expiry;
        var parts = window.location.hostname.split('.');
        while (parts.length > 1) {
          document.cookie = expiry + '; domain=' + parts.join('.');
          parts.shift();
        }
      });
      // Le rechargement retire aussi la bibliothèque déjà chargée.
      if (document.querySelector('script[data-ltm-analytics]')) window.location.reload();
    }
  }

  function showBanner() {
    if (document.getElementById('ltm-cookie-banner')) return;
    var banner = document.createElement('section');
    banner.id = 'ltm-cookie-banner';
    banner.className = 'ltm-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'ltm-cookie-title');
    banner.innerHTML =
      '<div class="ltm-cookie-copy">' +
        '<strong id="ltm-cookie-title">Votre choix concernant la mesure d’audience</strong>' +
        '<p>Avec votre accord, Google Analytics nous aide à comprendre quelles recettes sont consultées. Vous pouvez accepter ou refuser sans conséquence sur l’accès au site. <a href="/confidentialite.html">En savoir plus</a>.</p>' +
      '</div>' +
      '<div class="ltm-cookie-actions">' +
        '<button type="button" class="ltm-cookie-button ltm-cookie-refuse" data-ltm-consent="refused">Refuser</button>' +
        '<button type="button" class="ltm-cookie-button ltm-cookie-accept" data-ltm-consent="accepted">Accepter</button>' +
      '</div>';
    document.body.appendChild(banner);
    banner.querySelector('[data-ltm-consent="refused"]').addEventListener('click', function () {
      saveChoice('refused');
    });
    banner.querySelector('[data-ltm-consent="accepted"]').addEventListener('click', function () {
      saveChoice('accepted');
    });
  }

  function addSettingsButton() {
    if (document.getElementById('ltm-cookie-settings')) return;
    var button = document.createElement('button');
    button.id = 'ltm-cookie-settings';
    button.className = 'ltm-cookie-settings';
    button.type = 'button';
    button.textContent = 'Gérer mes cookies';
    button.addEventListener('click', showBanner);
    document.body.appendChild(button);
  }

  function init() {
    addSettingsButton();
    var choice = null;
    try {
      choice = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      choice = null;
    }
    if (choice === 'accepted') {
      loadAnalytics();
    } else if (choice !== 'refused') {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
