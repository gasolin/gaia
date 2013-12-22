'use strict';

define('modules/SettingsService',
  ['modules/PageTransitions', 'modules/StaticPanelCache',
   'shared/js/lazy_loader'],
  function(PageTransitions, StaticPanelCache) {
    var _currentPanelId = null;
    var _currentPanel = null;

    var _navigate = function ss_navigate(panelId, options) {
      _loadPanel(panelId, function() {
        // Get the list of the requiring modules
        var newPanelElement = document.getElementById(panelId);
        var currentPanelElement =
            _currentPanelId ? document.getElementById(_currentPanelId) : null;

        var requiredModulePaths = Array.prototype.map.call(
          newPanelElement.querySelectorAll('module'), function(module) {
            return module.dataset.path;
        });

        require(requiredModulePaths, function(panel) {
          // Get the panel object for the static panel.
          if (!panel) {
            panel = StaticPanelCache.get(panelId);
          }

          // Prepare options and calls to the panel object's ready function.
          options = options || {};
          options.modules = Array.prototype.slice.call(arguments, 1);
          panel.ready(newPanelElement, options);

          // Do transition
          PageTransitions.oneColumn(currentPanelElement, newPanelElement);

          // Update info
          _currentPanelId = panelId;
          if (_currentPanel) {
            _currentPanel.done();
          }
          _currentPanel = panel;
        });
      });
    };

    var _loadPanel = function ss_loadPanel(panelId, callback) {
      var panel = document.getElementById(panelId);
      if (panel.dataset.rendered) { // already initialized
        callback();
        return;
      }
      panel.dataset.rendered = true;
      LazyLoader.load([panel], callback);
    };

    return {
      navigate: _navigate
    };
});
