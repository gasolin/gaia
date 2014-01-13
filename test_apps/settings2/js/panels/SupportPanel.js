/**
 * Used to show Device/Help panel
 */
define('panels/SupportPanel',
  ['modules/SettingsPanel', 'modules/Support'],
  function(SettingsPanel, Support) {
    'use strict';
    return function ctor_Support() {
      return SettingsPanel({
        onInit: function(rootElement) {
          Support.init();
        }
      });
    };
});
