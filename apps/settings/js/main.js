require(['config/require'], function() {
  'use strict';

  define('boot', function(require) {
    var SettingsCache = require('modules/SettingsCache'),
        SettingsService = require('modules/SettingsService'),
        Settings = require('settings');

    var options = {
      SettingsCache: SettingsCache,
      SettingsService: SettingsService
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
