(function() {
  'strict';
  require(['modules/SettingsService', 'modules/SettingsCache',
           'modules/PageTransitions', 'settings'],
    function(SettingsService, SettingsCache, PageTransitions, Settings) {
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
