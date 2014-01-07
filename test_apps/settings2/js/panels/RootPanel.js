/**
 * Used to show Main Settings panel.
 * Battery module is needed to show bettery level percent on main panel.
 */
define('panels/RootPanel', ['modules/SettingsPanel', 'modules/Battery'],
  function(SettingsPanel, Battery) {
    'use strict';

    return function ctor_RootPanel() {
      var BatteryItem = (function() {
        var _batteryLevelText = null;
        var _refreshText = function bi_refreshText() {
          navigator.mozL10n.localize(_batteryLevelText,
                                     'batteryLevel-percent-' + Battery.state,
                                     { level: Battery.level });
        };

        return {
          init: function bi_init(rootElement) {
            _batteryLevelText = rootElement.querySelector('#battery-desc');
          },
          ready: function bi_ready() {
            Battery.observe('level', _refreshText);
            Battery.observe('state', _refreshText);
            _refreshText();
          },
          done: function bi_done() {
            Battery.unobserve(_refreshText);
          }
        };
      })();

      return SettingsPanel({
        onInit: function(rootElement) {
          BatteryItem.init(rootElement);
        },
        onReady: function(rootElement) {
          BatteryItem.ready();
        },
        onDone: function(rootElement) {
          BatteryItem.done();
        }
      });
    };
});
