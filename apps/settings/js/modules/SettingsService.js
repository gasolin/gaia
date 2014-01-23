/**
 * @fileoverview navigate between panels.
 */
define(['modules/PageTransitions', 'modules/PanelCache', 'LazyLoader'],
  function(PageTransitions, PanelCache, LazyLoader) {
    'use strict';
    var _currentPanelId = null;
    var _currentPanel = null;

    var _navigate = function ss_navigate(isTabletAndLandscape,
      panelId, options, callback) {
      _loadPanel(panelId, function() {
        var newPanelElement = document.getElementById(panelId);
        var currentPanelElement =
            _currentPanelId ? document.getElementById(_currentPanelId) : null;

        PanelCache.get(panelId, function(panel) {
          // Prepare options and calls to the panel object's ready function.
          options = options || {};
          // Update info
          panel.ready(newPanelElement, options);

          // Do transition
          _transit(isTabletAndLandscape, currentPanelElement, newPanelElement);

          _currentPanelId = panelId;
          if (_currentPanel) {
            _currentPanel.done();
          }
          _currentPanel = panel;

          if (callback) {
            callback();
          }
        });
      });
    };

    var _transit = function ss_transit(isTabletAndLandscape,
      oldPanel, newPanel, callback) {
      if (isTabletAndLandscape) {
        PageTransitions.twoColumn(oldPanel, newPanel, callback);
      } else {
        PageTransitions.oneColumn(oldPanel, newPanel, callback);
      }
    };

    var _loadPanel = function ss_loadPanel(panelId, callback) {
      var panelElement = document.getElementById(panelId);
      if (panelElement.dataset.rendered) { // already initialized
        callback();
        return;
      }
      panelElement.dataset.rendered = true;

      // XXX remove SubPanel loader once sub panel are modulized
      if (panelElement.dataset.requireSubPanels) {
        // load the panel and its sub-panels (dependencies)
        // (load the main panel last because it contains the scripts)
        var selector = 'section[id^="' + panelElement.id + '-"]';
        var subPanels = document.querySelectorAll(selector);
        for (var i = 0, il = subPanels.length; i < il; i++) {
          LazyLoader.load([subPanels[i]]);
        }
        LazyLoader.load([panelElement], callback);
      } else {
        LazyLoader.load([panelElement], callback);
      }
    };

    return {
      navigate: _navigate
    };
});
