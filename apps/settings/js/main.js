(function() {
  'strict';
  require.config({
    paths: {
      'modules': './modules'
    },
    shim: {
      'settings': {
        exports: 'Settings'
      }
    }
  });

  require(['settings', 'modules/SettingsCache', 'modules/PanelUtils',
           'modules/PageTransitions'],
    function(Settings, SettingsCache, PanelUtils, PageTransitions) {
      Settings.preInit(SettingsCache, PanelUtils, PageTransitions);
  });
})();
