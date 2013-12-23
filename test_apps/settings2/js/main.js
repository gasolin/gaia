'strict';

(function() {
  var _launchPanel = 'root';
  var _webActivityHandler = function(activityRequest) {
    var name = activityRequest.source.name;
    switch (name) {
      case 'configure':
        section = activityRequest.source.data.section;

        if (!section) {
          // If there isn't a section specified,
          // simply show ourselve without making ourselves a dialog.
        }

        // Validate if the section exists
        var sectionElement = document.getElementById(section);
        if (!sectionElement || sectionElement.tagName !== 'SECTION') {
          var msg = 'Trying to open an non-existent section: ' + section;
          console.warn(msg);
          activityRequest.postError(msg);
          return;
        }

        // Go to that section
        _launchPanel = section;
        break;
    }

    // Mark the desired panel as a dialog
    /*if (Settings._currentActivity !== null) {
      var domSection = document.getElementById(section);
      domSection.dataset.dialog = true;
      document.addEventListener('visibilitychange',
        Settings.visibilityHandler);
    }*/
  };

  // Register the handler as soon as possible.
  navigator.mozSetMessageHandler('activity', _webActivityHandler);

  require({
    paths: {
      'shared': '../shared'
    }
  });

  require([
    'modules/SettingsService'
  ], function (SettingsService) {
    if (!navigator.mozSettings || !navigator.mozSetMessageHandler) {
      return;
    }

    SettingsService.navigate(_launchPanel);
  });
})();
