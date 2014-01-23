(function() {
  'strict';
  require(['settings', 'modules/SettingsService', 'modules/SettingsCache',
           'modules/PageTransitions'],
    function(Settings, SettingsService, SettingsCache, PageTransitions) {
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
})();
