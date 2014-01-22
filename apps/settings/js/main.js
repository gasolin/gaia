(function() {
  require(['modules/SettingsCache', 'modules/PanelHandlers',
           'modules/PageTransitions', 'settings'],
    function(SettingsCache, PanelHandlers, PageTransitions, Settings) {
      'strict';
      Settings.preInit(SettingsCache, PanelHandlers, PageTransitions);
  });
})();
