define('panels/RootPanel', ['modules/Panel', 'modules/Battery'],
  function(Panel, Battery) {
    return function ctor_RootPanel() {
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

      return Panel({
        onInit: function(rootElement) {
          BatteryItem.init(rootElement);
        },
        onReady: function(rootElement) {
          BatteryItem.ready();
        },
        onDone: function(rootElement) {
          BatteryItem.done();
        }
      });
    };
});
