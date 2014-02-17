/**
 * SettingsService is a singleton that provides a navigation service. It
 * gets the corresponding panel module from PanelCache and call to its basic
 * functions when navigating.
 *
 * @module SettingsService
 */
define(['modules/page_transitions', 'modules/panel_cache',
        'shared/lazy_loader'],
  function(PageTransitions, PanelCache, LazyLoader) {
    'use strict';
    var _currentPanelId = null;
    var _currentPanel = null;
    var _navigating = false;

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
      /**
       * Navigate to a panel with options.
       *
       * @alias module:SettingsService#navigate
       * @param {Boolean} twoColumn
       *                  Specifies if we are using two column mode. (This
       *                  should be removed)
       * @param {String} panelId
       * @param {Object} options
       * @param {Function} callback
       */
      navigate: function ss_navigate(twoColumn, panelId, options, callback) {
        // Ignore the navigation request if it is navigating
        if (_navigating) {
          if (callback) {
            callback(false);
          }
          return;
        }

        _navigating = true;
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
                    callback(true);
                  }
                  _navigating = false;
              }).bind(this));
            }).bind(this));
          });
        });
      }
    };
});
