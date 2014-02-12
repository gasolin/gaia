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
      options.onShow = options.onShow || _emptyFunc;
      options.onHide = options.onHide || _emptyFunc;
      options.onBeforeShow = options.onBeforeShow || _emptyFunc;

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
        onShow: function(panel, showOptions) {
          options.onShow(panel, showOptions);
        },
        onHide: function() {
          // Remove listeners.
          _removeListeners(_panel);

          options.onHide();
        },
        onBeforeShow: function(panel, beforeShowOptions) {
          // Preset the panel every time when it is presented.
          PanelUtils.preset(panel);
          _addListeners(panel);
          options.onBeforeShow(panel, beforeShowOptions);
        },
        onBeforeHide: options.onBeforeHide
      });
    };
});
