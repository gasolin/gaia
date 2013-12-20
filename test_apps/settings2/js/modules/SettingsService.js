define('modules/SettingsService', ['modules/PageTransitions'],
  function (PageTransitions) {
    var _currentHash = '';
    var _history = [];
    var _navigate = function ss_navigate(panelId, options) {
      // We need a way for panels to specify modules they require.

      // Extract the DOM element
      _loadPanel(panelId, function() {
        // Get the list of the required modules
        var panelElement = document.getElementById(panelId);
        var panelPath = panelElement.querySelector('panel').dataset.path;
        var modulePaths = Array.prototype.map.call(
          panelElement.querySelectorAll('module'), function(module) {
            return module.dataset.path;
        });

        require(modulePaths.unshift(panelPath), function(panel) {
          options = options || {};
          options.modules = Array.prototype.slice.call(arguments, 1);
          options.service = _service;

          var oldPanelElement = document.getElementById(_currentHash);
          PageTransitions.oneColumn(oldPanelElement, panelElement, function() {
            panel.ready(panelElement, options);
          });
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
