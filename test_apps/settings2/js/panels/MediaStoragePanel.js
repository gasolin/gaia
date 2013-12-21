define('panels/MediaStoragePanel',
  ['modules/Panel', 'modules/MediaStorage'],
  function(Panel, MediaStorage) {
    var _initialized = false;
    var _init = function msp_init(rootElement, options) {
      _initialized = true;
      MediaStorage.init(rootElement);
    };

    var _ready = function msp_ready(rootElement, options) {
      this.__proto__.ready(rootElement, options);

      if (!_initialized) {
        _init(rootElement, options);
      }
    };

    var panel = {
      ready: _ready
    };
    panel.__proto__ = Panel();

    return panel;
});
