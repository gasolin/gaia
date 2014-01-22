(function() {
  require(['modules/SettingsCache', 'modules/PanelUtils',
           'modules/PageTransitions', 'settings'],
    function(SettingsCache, PanelUtils, PageTransitions, Settings) {
      'strict';
      Settings.preInit(SettingsCache, PanelUtils, PageTransitions);
  });
})();
