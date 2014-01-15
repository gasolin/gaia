/**
 * Used to show Main Settings panel.
 * Battery module is needed to show bettery level percent on main panel.
 */
define('panels/RootPanel',
  ['modules/SettingsPanel', 'modules/Battery'],
  function(SettingsPanel, Battery) {
    'use strict';

    return function ctor_RootPanel() {
      /** hide telephony related panels if not supported */
      var _handleTelephonyPanels = function rp_telephony() {
        if (!navigator.mozTelephony) {
          var elements = ['call-settings',
                          'data-connectivity',
                          'messaging-settings',
                          'simSecurity-settings'];
          elements.forEach(function(el) {
            document.getElementById(el).hidden = true;
          });
        } else {
          _handleRadioAndCardState();
        }
      };

      /**
       * Enable or disable the menu items related to the ICC card relying on the
       * card and radio state.
       */
      var _handleRadioAndCardState = function rp_radiocard() {
        var iccId;

        // we hide all entry points by default,
        // so we have to detect and show them up
        if (navigator.mozMobileConnections) {
          if (navigator.mozMobileConnections.length == 1) {
            // single sim
            document.getElementById('simSecurity-settings').hidden = false;
          } else {
            // dsds
            document.getElementById('simCardManager-settings').hidden = false;
          }
        }

        var mobileConnections = window.navigator.mozMobileConnections;
        var iccManager = window.navigator.mozIccManager;
        if (!mobileConnections || !iccManager) {
          disableSIMRelatedSubpanels(true);
          return;
        }

        function disableSIMRelatedSubpanels(disable) {
          var itemIds = ['messaging-settings'];

          if (mobileConnections.length === 1) {
            itemIds.push('call-settings');
            itemIds.push('data-connectivity');
          }

          // Disable SIM security item in case of SIM absent or airplane mode.
          // Note: mobileConnections[0].iccId being null could mean there is no
          // ICC card or the ICC card is locked. If locked we would need to
          // figure out how to check the current card state.
          if (!mobileConnections[0].iccId ||
              (mobileConnections[0].radioState === 'disabled')) {
            itemIds.push('simSecurity-settings');
          }

          for (var id = 0; id < itemIds.length; id++) {
            var item = document.getElementById(itemIds[id]);
            if (!item) {
              continue;
            }

            if (disable) {
              item.setAttribute('aria-disabled', true);
            } else {
              item.removeAttribute('aria-disabled');
            }
          }
        }

        function cardStateAndRadioStateHandler() {
          if (!mobileConnections[0].iccId) {
            // This could mean there is no ICC card or the ICC card is locked.
            disableSIMRelatedSubpanels(true);
            return;
          }

          if (mobileConnections[0].radioState !== 'enabled') {
            // Airplane is enabled. Well, radioState property could be changing
            // but let's disable the items during the transitions also.
            disableSIMRelatedSubpanels(true);
            return;
          }
          if (mobileConnections[0].radioState === 'enabled') {
            disableSIMRelatedSubpanels(false);
          }

          var iccCard = iccManager.getIccById(mobileConnections[0].iccId);
          if (!iccCard) {
            disableSIMRelatedSubpanels(true);
            return;
          }
          var cardState = iccCard.cardState;
          disableSIMRelatedSubpanels(cardState !== 'ready');
        }

        function addListeners() {
          iccId = mobileConnections[0].iccId;
          var iccCard = iccManager.getIccById(iccId);
          if (!iccCard) {
            return;
          }
          iccCard.addEventListener('cardstatechange',
            cardStateAndRadioStateHandler);
          mobileConnections[0].addEventListener('radiostatechange',
            cardStateAndRadioStateHandler);
        }

        cardStateAndRadioStateHandler();
        addListeners();

        iccManager.addEventListener('iccdetected',
          function iccDetectedHandler(evt) {
            if (mobileConnections[0].iccId &&
               (mobileConnections[0].iccId === evt.iccId)) {
              cardStateAndRadioStateHandler();
              addListeners();
            }
        });

        iccManager.addEventListener('iccundetected',
          function iccUndetectedHandler(evt) {
            if (iccId === evt.iccId) {
              disableSIMRelatedSubpanels(true);
              mobileConnections[0].removeEventListener('radiostatechange',
                cardStateAndRadioStateHandler);
            }
        });
      };

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
          _handleTelephonyPanels();
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
