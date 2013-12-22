define('panels/RootPanel', ['modules/Panel', 'modules/Battery'],
  function(Panel, Battery) {
    var BatteryItem = (function() {
      var _batteryLevelText = null;
      var _refreshText = function bi_refreshText() {
        navigator.mozL10n.localize(_batteryLevelText,
                                   'batteryLevel-percent-' + Battery.state,
                                   { level: Battery.level });
      };

      return {
        init: function bi_init(rootElement) {
          _batteryLevelText = rootElement.querySelector('#battery-desc');
        },
        ready: function bi_ready() {
          Battery.observe('level', _refreshText);
          Battery.observe('state', _refreshText);
          _refreshText();
        },
        done: function bi_done() {
          Battery.unobserve(_refreshText);
        }
      };
    })();

    var _init = function(rootElement, options) {
      BatteryItem.init(rootElement);
    };

    var _ready = function(rootElement, options) {
      BatteryItem.ready();
    };

    var _done = function() {
      BatteryItem.done();
    };

    return Panel(_init, null, _ready, _done);
});
