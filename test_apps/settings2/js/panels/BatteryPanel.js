define('panels/BatteryPanel', ['modules/Panel', 'modules/Battery'],
  function(Panel, Battery) {
    return function ctor_BatteryPanel() {
      var _batteryLevelText = null;
      var _refreshText = function() {
        navigator.mozL10n.localize(_batteryLevelText,
                                   'batteryLevel-percent-' + Battery.state,
                                   { level: Battery.level });
      };

      return Panel({
        onInit: function(rootElement) {
          _batteryLevelText = rootElement.querySelector('#battery-level *');
        },
        onReady: function(rootElement) {
          Battery.observe('level', _refreshText);
          Battery.observe('state', _refreshText);
          _refreshText();
        },
        onDone: function() {
          Battery.unobserve(_refreshText);
        }
      });
    };
});
