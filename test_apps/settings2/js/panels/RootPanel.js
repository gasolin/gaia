/**
 * Used to show Main Settings panel.
 * Battery module is needed to show bettery level percent on main panel.
 */
define('panels/RootPanel',
  ['modules/SettingsPanel', 'modules/Battery', 'modules/Utils'],
  function(SettingsPanel, Battery, Utils) {
    'use strict';

    return function ctor_RootPanel() {
      var LocaleItem = (function() {
        var _languages = '';
        var _getSupportedLanguages = function sl_getLanguages(callback) {
          if (!callback)
            return;

          if (_languages) {
            callback(_languages);
          } else {
            var self = this;
            var LANGUAGES = '/shared/resources/languages.json';
            Utils.loadJSON(LANGUAGES, function loadLanguages(data) {
              if (data) {
                _languages = data;
                callback(_languages);
              }
            });
          }
        };

        var _initLocale = function sl_initLocale() {
          var lang = navigator.mozL10n.language.code;

          // set the 'lang' and 'dir' attributes to <html> when the page is
          // translated
          document.documentElement.lang = lang;
          document.documentElement.dir = navigator.mozL10n.language.direction;

          // display the current locale in the main panel
          _getSupportedLanguages(function displayLang(languages) {
            document.getElementById('language-desc').textContent =
                    languages[lang];
          });
        };

        return {
          ready: function sl_init() {
            navigator.mozL10n.ready(function startupLocale() {
              _initLocale();
              // XXX this might call `initLocale()` twice until
              // bug 882592 is fixed
              window.addEventListener('localized', _initLocale);
            });
          }
        };
      })();

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
          LocaleItem.ready();
        },
        onDone: function(rootElement) {
          BatteryItem.done();
        }
      });
    };
});
