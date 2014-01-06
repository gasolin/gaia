define('modules/Battery', ['modules/mvvm/Observable'], function(Observable) {
  'use strict';
  var _mozBattery = navigator.battery;

  var _getLevel = function() {
    return Math.min(100, Math.round(_mozBattery.level * 100));
  };

  var _getState = function() {
    if (_mozBattery.charging) {
      return (_getLevel() == 100) ? 'charged' : 'charging';
    } else {
      return 'unplugged';
    }
  };

  var _battery = Observable({
    level: _getLevel(),
    state: _getState(),
  });

  var _handleEvent = function b_handleEvent(event) {
    switch (event.type) {
      case 'levelchange':
        _battery.level = _getLevel();
        break;
      case 'chargingchange':
        _battery.state = _getState();
        break;
    }
  };

  _mozBattery.addEventListener('levelchange', _handleEvent);
  _mozBattery.addEventListener('chargingchange', _handleEvent);

  return _battery;
});
