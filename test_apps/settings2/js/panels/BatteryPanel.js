define('panels/BatteryPanel', ['modules/Panel', 'modules/Battery'],
  function (Panel, Battery) {
    var _initialized = false;
    var _init = function(rootElement, options) {
      _initialized = true;

      _initBatteryText(rootElement);
    };

    var _ready = function(rootElement, options) {
      this.__proto__.ready(rootElement, options);

      if (!_initialized) {
        _init(rootElement, options);
      }
    };

    var _initBatteryText = function(rootElement) {
      var _batteryLevelText = rootElement.querySelector('#battery-level *');
      var _refreshText = function() {
        navigator.mozL10n.localize(_batteryLevelText,
                                   'batteryLevel-percent-' + Battery.state,
                                   { level: Battery.level });
      };

      Battery.observe('level', _refreshText);
      Battery.observe('state', _refreshText);
      _refreshText();
    };

    var panel = {
      ready: _ready
    };
    panel.__proto__ = Panel();

    return panel;
});
