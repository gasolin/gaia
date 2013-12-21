define(function() {
  var _settings = window.navigator.mozSettings;
  var _settingsCache = null;
  var _settingsCacheRequestSent = null;
  var _pendingSettingsCallbacks = [];

  var _callbacks = [];
 
  var _getSettings = function sc_getSettings(callback) {
    if (!_settings)
      return;

    if (_settingsCache && callback) {
      // Fast-path that we hope to always hit: our settings cache is
      // already available, so invoke the callback now.
      callback(_settingsCache);
      return;
    }

    if (!_settingsCacheRequestSent && !_settingsCache) {
      _settingsCacheRequestSent = true;
      var lock = _settings.createLock();
      var request = lock.get('*');
      request.onsuccess = function(e) {
        var result = request.result;
        var cachedResult = {};
        for (var attr in result) {
          cachedResult[attr] = result[attr];
        }
        _settingsCache = cachedResult;
        var cbk;
        while ((cbk = _pendingSettingsCallbacks.pop())) {
          cbk(result);
        }
      };
    }
    if (callback) {
      _pendingSettingsCallbacks.push(callback);
    }
  };

  var _addEventListener = function sc_addEventListener(eventName, callback) {
    if (eventName !== 'settingsChange')
      return;
    _callbacks.push(callback);
  };

  _settings.onsettingchange = function sc_onSettingsChange(event) {
    var key = event.settingName;
    var value = event.settingValue;

    // Always update the cache if it's present, even if the DOM
    // isn't loaded yet.
    if (_settingsCache) {
      _settingsCache[key] = value;
    }

    _callbacks.forEach(function(callback) {
      callback(event);
    });
  };

  // Make a request for settings to warm the cache, since we need it
  // very soon in startup after the DOM is available.
  _getSettings(null);

  return {
    getSettings: _getSettings,
    addEventListener: _addEventListener
  }
});
