require(['config/require'], function() {
  'use strict';

  define('boot', function(require) {
    var SettingsService = require('modules/settings_service'),
        SettingsCache = require('modules/settings_cache'),
        PageTransitions = require('modules/page_transitions'),
        Settings = require('settings');

    var options = {
      SettingsService: SettingsService,
      SettingsCache: SettingsCache,
      PageTransitions: PageTransitions
    };

    if (document && (document.readyState === 'complete' ||
        document.readyState === 'interactive')) {
      Settings.init(options);
    } else {
      window.addEventListener('load', function onload() {
        window.removeEventListener('load', onload);
        Settings.init(options);
      });
    }
  });

  require(['boot']);
});
