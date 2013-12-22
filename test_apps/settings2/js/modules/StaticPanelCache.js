'use strict';

define('modules/StaticPanelCache', ['modules/Panel'], function(Panel) {
  var _staticPanelCache = {};
  return {
    get: function spc_get(panelId) {
      var cachedPanel = _staticPanelCache[panelId];
      if (cachedPanel) {
        return cachedPanel;
      } else {
        var panel = Panel();
        _staticPanelCache[panelId] = panel;
        return panel;
      }
    }
  };
});
