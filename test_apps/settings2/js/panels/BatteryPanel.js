define('panels/BatteryPanel', ['modules/Panel', 'modules/Battery'],
  function(Panel, Battery) {
    var _batteryLevelText = null;
    var _refreshText = function() {
      navigator.mozL10n.localize(_batteryLevelText,
                                 'batteryLevel-percent-' + Battery.state,
                                 { level: Battery.level });
    };

    var _init = function(rootElement, options) {
      _batteryLevelText = rootElement.querySelector('#battery-level *');
    };

    var _ready = function(rootElement, options) {
      Battery.observe('level', _refreshText);
      Battery.observe('state', _refreshText);
      _refreshText();
    };

    var _done = function() {
      Battery.unobserve(_refreshText);
    };

    return Panel(_init, null, _ready, _done);
});
