require(['config/require'], function() {
  'use strict';

  define('boot', function(require) {
    var SettingsService = require('modules/SettingsService'),
        SettingsCache = require('modules/SettingsCache'),
        PageTransitions = require('modules/PageTransitions'),
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
