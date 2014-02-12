/**
 * @fileoverview navigate between panels.
 */
define(['modules/page_transitions', 'modules/panel_cache', 'LazyLoader'],
  function(PageTransitions, PanelCache, LazyLoader) {
    'use strict';
    var _currentPanelId = null;
    var _currentPanel = null;

    var _navigate = function ss_navigate(twoColumn,
      panelId, options, callback) {
      _loadPanel(panelId, function() {
        var newPanelElement = document.getElementById(panelId);
        var currentPanelElement =
            _currentPanelId ? document.getElementById(_currentPanelId) : null;

        PanelCache.get(panelId, function(panel) {
          // Prepare options and calls to the panel object's before
          // show function.
          options = options || {};
          panel.beforeShow(newPanelElement, options);
          if (_currentPanel) {
            _currentPanel.beforeHide();
          }

          // Add a timeout for smoother transition
          setTimeout((function doTransition() {
            // Do transition
            _transit(twoColumn, currentPanelElement, newPanelElement,
              (function transitionCompleted() {
                panel.show(newPanelElement, options);
                if (_currentPanel) {
                  _currentPanel.hide();
                }

                _currentPanelId = panelId;
                _currentPanel = panel;

                if (callback) {
                  callback();
                }
            }).bind(this));
          }).bind(this));
        });
      });
    };

    var _transit = function ss_transit(twoColumn,
      oldPanel, newPanel, callback) {
      if (twoColumn) {
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
