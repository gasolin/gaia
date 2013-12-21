require([
  'modules/SettingsService'
], function (SettingsService) {
  navigator.mozL10n.ready(function() {
    SettingsService.navigate('root');
  });
});
