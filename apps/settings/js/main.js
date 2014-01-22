(function() {
  'strict';
  require(['settings', 'modules/SettingsCache', 'modules/PanelUtils',
           'modules/PageTransitions'],
    function(Settings, SettingsCache, PanelUtils, PageTransitions) {
      Settings.preInit(SettingsCache, PanelUtils, PageTransitions);
  });
})();
