/**
 * @fileoverview Settings panel class
 */
define(['modules/Panel', 'modules/SettingsCache', 'modules/PanelUtils',
        'LazyLoader'],
  function(Panel, SettingsCache, PanelUtils, LazyLoader) {
    'use strict';
    var _emptyFunc = function panel_emptyFunc() {};
    return function ctor_SettingsPanel(options) {
      var _panel = null;

      var _settingsChangeHandler = function(event) {
        if (_panel) {
          PanelUtils.onSettingsChange(_panel, event);
        }
      };

      var _addListeners = function panel_addListeners(panel) {
        if (!panel) {
          return;
        }

        SettingsCache.addEventListener('settingsChange',
          _settingsChangeHandler);
        panel.addEventListener('change', PanelUtils.onInputChange);
        panel.addEventListener('click', PanelUtils.onLinkClick);
      };

      var _removeListeners = function panel_removeListeners(panel) {
        if (!panel) {
          return;
        }

        SettingsCache.removeEventListener('settingsChange',
          _settingsChangeHandler);
        panel.removeEventListener('change', PanelUtils.onInputChange);
        panel.removeEventListener('click', PanelUtils.onLinkClick);
      };

      options = options || {};
      options.onInit = options.onInit || _emptyFunc;
      options.onUninit = options.onUninit || _emptyFunc;
      options.onReady = options.onReady || _emptyFunc;
      options.onDone = options.onDone || _emptyFunc;

      return Panel({
        onInit: function(panel, initOptions) {
          _panel = panel;
          PanelUtils.activate(panel);

          options.onInit(panel, initOptions);
        },
        onUninit: function() {
          _removeListeners(_panel);
          _panel = null;

          options.onUninit();
        },
        onReady: function(panel, readyOptions) {
          // Preset the panel every time when it is presented.
          PanelUtils.preset(panel);
          _addListeners(panel);

          options.onReady(panel, readyOptions);
        },
        onDone: function() {
          // Remove listeners.
          _removeListeners(_panel);

          options.onDone();
        }
      });
    };
});
