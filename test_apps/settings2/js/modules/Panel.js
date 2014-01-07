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
      var _onReady = options.onReady || _emptyFunc;
      var _onDone = options.onDone || _emptyFunc;

      return {
        get initialized() {
          return _initialized;
        },
        init: function(panel, initOptions) {
          if (_initialized)
            return;
          _initialized = true;

          _onInit(panel, initOptions);
        },
        uninit: function() {
          if (!_initialized)
            return;
          _initialized = false;

          _onUninit();
        },
        ready: function(panel, readyOptions) {
          this.init(panel, readyOptions);

          _onReady(panel, readyOptions);
        },
        done: function() {
          _onDone();
        }
      };
    };
    return Panel;
});
