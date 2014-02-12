/**
 * @fileoverview Base panel class
 */
define(function() {
  'use strict';

  var _emptyFunc = function panel_emptyFunc() {};
  var Panel = function(options) {
      var _initialized = false;

      options = options || {};
      var _onInit = options.onInit || _emptyFunc;
      var _onUninit = options.onUninit || _emptyFunc;
      var _onShow = options.onShow || _emptyFunc;
      var _onHide = options.onHide || _emptyFunc;
      var _onBeforeShow = options.onBeforeShow || _emptyFunc;
      var _onBeforeHide = options.onBeforeHide || _emptyFunc;

      return {
        get initialized() {
          return _initialized;
        },
        init: function(panel, initOptions) {
          if (_initialized) {
            return;
          }
          _initialized = true;

          _onInit(panel, initOptions);
        },
        uninit: function() {
          if (!_initialized) {
            return;
          }
          _initialized = false;

          _onUninit();
        },
        show: function(panel, showOptions) {
          _onShow(panel, showOptions);
        },
        hide: function() {
          _onHide();
        },
        beforeShow: function(panel, beforeShowOptions) {
          this.init(panel, beforeShowOptions);
          _onBeforeShow(panel, beforeShowOptions);
        },
        beforeHide: function() {
          _onBeforeHide();
        }
      };
    };
    return Panel;
});
