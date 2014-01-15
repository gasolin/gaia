/**
 * @fileoverview initiate panel.
 * Cache panel and resources for reuse.
 */
define('modules/PanelCache',
  ['modules/SettingsPanel', 'LazyLoader'],
  function(SettingsPanel, LazyLoader) {
  'use strict';
  var _panelCache = {};
  var _panelStylesheetsLoaded = false;

  // experiment result shows
  // load all related styles once is time saver
  var _loadPanelStylesheetsIfNeeded = function loadPanelCSS() {
    if (_panelStylesheetsLoaded) {
      return;
    }

    LazyLoader.load(['shared/style/action_menu.css',
                     'shared/style/buttons.css',
                     'shared/style/confirm.css',
                     'shared/style/input_areas.css',
                     'shared/style_unstable/progress_activity.css',
                     'style/apps.css',
                     'style/phone_lock.css',
                     'style/simcard.css',
                     'style/updates.css',
                     'style/downloads.css'],
    function callback() {
      _panelStylesheetsLoaded = true;
    });
  };

  // load styles in idle time after document loaded
  navigator.addIdleObserver({
    time: 3,
    onidle: _loadPanelStylesheetsIfNeeded
  });

  return {
    get: function spc_get(panelId, callback) {
      if (!callback)
        return;

      if (panelId !== 'root') {
        _loadPanelStylesheetsIfNeeded();
      }

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
          var panel = panelFunc ? panelFunc() : SettingsPanel();
          _panelCache[panelId] = panel;
          callback(panel);
        });
      }
    }
  };
});
