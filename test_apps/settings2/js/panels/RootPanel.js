define('panels/RootPanel', ['modules/Panel', 'modules/Battery'],
  function(Panel, Battery) {
    var _init = function(rootElement, options) {
      _initBatteryText(rootElement);
    };

    var _initBatteryText = function(rootElement) {
      var _batteryLevelText = rootElement.querySelector('#battery-desc');
      var _refreshText = function() {
        navigator.mozL10n.localize(_batteryLevelText,
                                   'batteryLevel-percent-' + Battery.state,
                                   { level: Battery.level });
      };

      Battery.observe('level', _refreshText);
      Battery.observe('state', _refreshText);
      _refreshText();
    };

    return Panel(_init);
});
