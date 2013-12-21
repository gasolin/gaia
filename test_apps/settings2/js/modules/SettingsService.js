define('modules/SettingsService', ['modules/PageTransitions'],
  function (PageTransitions) {
    var _currentHash = null;
    var _history = [];

    var _navigate = function ss_navigate(panelId, options) {
      _loadPanel(panelId, function() {
        // Get the list of the requiring modules
        var panelElement = document.getElementById(panelId);
        var requiredModulePaths = Array.prototype.map.call(
          panelElement.querySelectorAll('module'), function(module) {
            return module.dataset.path;
        });
        require(requiredModulePaths, function(panel) {
          if (!panel) {
            _currentHash = panelId;
            return;
          }
          options = options || {};
          options.modules = Array.prototype.slice.call(arguments, 1);
          options.service = _service;

          var oldPanelElement =
            _currentHash ? document.getElementById(_currentHash) : null;
          PageTransitions.oneColumn(oldPanelElement, panelElement, function() {
            panel.ready(panelElement, options);
          });
          _currentHash = panelId;
        });
      });
    };

    var _loadPanel = function ss_loadPanel(panelId, callback) {
      var panel = document.getElementById(panelId);
      if (panel.dataset.rendered) { // already initialized
        callback();
      }
      panel.dataset.rendered = true;
      LazyLoader.load([panel], callback);
    };

    var _service = {
      navigate: _navigate,
      get history() {
        return _history;
      }
    };

    return _service;
});
