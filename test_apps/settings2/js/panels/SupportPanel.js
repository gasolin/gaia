/**
 * Used to show Device/Help panel
 */
define('panels/SupportPanel', ['modules/SettingsPanel'],
  function(SettingsPanel) {
    'use strict';
    return function ctor_Support() {
      return SettingsPanel({
        onInit: function(rootElement) {
          Support().init(rootElement);
        }
      });
    };
});
