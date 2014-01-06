/**
 * Used to show Storage/Media storage panel
 */
define('panels/MediaStoragePanel',
  ['modules/SettingsPanel', 'modules/MediaStorage'],
  function(SettingsPanel, MediaStorage) {
    'use strict';
    return function ctor_MediaStorage() {
      return SettingsPanel({
        onInit: function(rootElement) {
          MediaStorage().init(rootElement);
        }
      });
    };
});
