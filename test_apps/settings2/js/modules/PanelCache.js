define('modules/PanelCache', ['modules/SettingsPanel'],
  function(SettingsPanel) {
  'use strict';
  var _panelCache = {};

  return {
    get: function spc_get(panelId, callback) {
      if (!callback)
        return;

      var cachedPanel = _panelCache[panelId];
      if (cachedPanel) {
        callback(cachedPanel);
      } else {
        // Get the path of the panel creation function
        var panelElement = document.getElementById(panelId);
        var pathElement = panelElement.querySelector('panel');
        var path = pathElement ? pathElement.dataset.path : '';

        require([path], function(panelFunc) {
          // Create a new panel object for static panels.
          var panel = panelFunc ? new panelFunc() : new SettingsPanel();
          _panelCache[panelId] = panel;
          callback(panel);
        });
      }
    }
  };
});
