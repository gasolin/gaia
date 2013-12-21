/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Debug note: to test this app in a desktop browser, you'll have to set
 * the `dom.mozSettings.enabled' preference to false in order to avoid an
 * `uncaught exception: 2147500033' message (= 0x80004001).
 */

var Settings = {
  isTabletAndLandscape: function is_tablet_and_landscape() {
    return ScreenLayout.getCurrentLayout('tabletAndLandscaped');
  },

  _panelsWithClass: function pane_with_class(targetClass) {
    return document.querySelectorAll(
      'section[role="region"].' + targetClass);
  },

  _isTabletAndLandscapeLastTime: null,

  rotate: function rotate(evt) {
    var isTabletAndLandscapeThisTime = Settings.isTabletAndLandscape();
    var panelsWithCurrentClass;
    if (Settings._isTabletAndLandscapeLastTime !==
        isTabletAndLandscapeThisTime) {
      panelsWithCurrentClass = Settings._panelsWithClass('current');
      // in two column style if we have only 'root' panel displayed,
      // (left: root panel, right: blank)
      // then show default panel too
      if (panelsWithCurrentClass.length === 1 &&
        panelsWithCurrentClass[0].id === 'root') {
        // go to default panel
        Settings.currentPanel = Settings.defaultPanelForTablet;
      }
    }
    Settings._isTabletAndLandscapeLastTime = isTabletAndLandscapeThisTime;
  },

  defaultPanelForTablet: '#wifi',

  _currentPanel: '#root',

  _currentActivity: null,

  get currentPanel() {
    return this._currentPanel;
  },

  set currentPanel(hash) {
    if (!hash.startsWith('#')) {
      hash = '#' + hash;
    }

    if (hash == this._currentPanel) {
      return;
    }

    // If we're handling an activity and the 'back' button is hit,
    // close the activity.
    // XXX this assumes the 'back' button of the activity panel
    //     points to the root panel.
    if (this._currentActivity !== null && hash === '#root') {
      Settings.finishActivityRequest();
      return;
    }

    if (hash === '#wifi') {
      PerformanceTestingHelper.dispatch('start');
    }
    var oldPanelHash = this._currentPanel;
    var oldPanel = document.querySelector(this._currentPanel);
    this._currentPanel = hash;
    var newPanelHash = this._currentPanel;
    var newPanel = document.querySelector(this._currentPanel);

    // load panel (+ dependencies) if necessary -- this should be synchronous
    this.lazyLoad(newPanel);

    this._transit(oldPanel, newPanel, function() {
      switch (newPanel.id) {
        case 'about-licensing':
          // Workaround for bug 825622, remove when fixed
          var iframe = document.getElementById('os-license');
          iframe.src = iframe.dataset.src;
          break;
        case 'wifi':
          PerformanceTestingHelper.dispatch('settings-panel-wifi-visible');
          break;
      }
    });
  },

  _initialized: false,

  init: function settings_init() {
    this._initialized = true;

    if (!this.mozSettings || !navigator.mozSetMessageHandler) {
      return;
    }

    // hide telephony related entries if not supportted
    if (!navigator.mozTelephony) {
      var elements = ['call-settings',
                      'data-connectivity',
                      'messaging-settings',
                      'simSecurity-settings'];
      elements.forEach(function(el) {
        document.getElementById(el).hidden = true;
      });
    }

    // register web activity handler
    //navigator.mozSetMessageHandler('activity', this.webActivityHandler);

    // preset all inputs that have a `name' attribute
    this.presetPanel();
  },

  // An activity can be closed either by pressing the 'X' button
  // or by a visibility change (i.e. home button or app switch).
  finishActivityRequest: function settings_finishActivityRequest() {
    // Remove the dialog mark to restore settings status
    // once the animation from the activity finish.
    // If we finish the activity pressing home, we will have a
    // different animation and will be hidden before the animation
    // ends.
    if (document.hidden) {
      this.restoreDOMFromActivty();
    } else {
      var self = this;
      document.addEventListener('visibilitychange', function restore(evt) {
        if (document.hidden) {
          document.removeEventListener('visibilitychange', restore);
          self.restoreDOMFromActivty();
        }
      });
    }

    // Send a result to finish this activity
    if (Settings._currentActivity !== null) {
      Settings._currentActivity.postResult(null);
      Settings._currentActivity = null;
    }
  },

  // When we finish an activity we need to leave the DOM
  // as it was before handling the activity.
  restoreDOMFromActivty: function settings_restoreDOMFromActivity() {
    var currentPanel = document.querySelector('[data-dialog]');
    if (currentPanel !== null) {
      delete currentPanel.dataset.dialog;
    }
  },

  visibilityHandler: function settings_visibilityHandler(evt) {
    if (document.hidden) {
      Settings.finishActivityRequest();
      document.removeEventListener('visibilitychange',
        Settings.visibilityHandler);
    }
  },

  openDialog: function settings_openDialog(dialogID) {
    var settings = this.mozSettings;
    var dialog = document.getElementById(dialogID);
    var fields =
        dialog.querySelectorAll('[data-setting]:not([data-ignore])');

    /**
     * In Settings dialog boxes, we don't want the input fields to be preset
     * by Settings.init() and we don't want them to set the related settings
     * without any user validation.
     *
     * So instead of assigning a `name' attribute to these inputs, a
     * `data-setting' attribute is used and the input values are set
     * explicitely when the dialog is shown.  If the dialog is validated
     * (submit), their values are stored into B2G settings.
     *
     * XXX warning:
     * this only supports text/password/radio/select/radio input types.
     */

    // initialize all setting fields in the dialog box
    // XXX for fields being added by lazily loaded script,
    // it would have to initialize the fields again themselves.
    function reset() {
      if (settings) {
        var lock = settings.createLock();
        for (var i = 0; i < fields.length; i++) {
          (function(input) {
            var key = input.dataset.setting;
            var request = lock.get(key);
            request.onsuccess = function() {
              switch (input.type) {
                case 'radio':
                  input.checked = (input.value == request.result[key]);
                  break;
                case 'checkbox':
                  input.checked = request.result[key] || false;
                  break;
                case 'select-one':
                  input.value = request.result[key] || '';
                  break;
                default:
                  input.value = request.result[key] || '';
                  break;
              }
            };
          })(fields[i]);
        }
      }
    }

    // validate all settings in the dialog box
    function submit() {
      if (settings) {
        // Update the fields node list to include dynamically added fields
        fields = dialog.querySelectorAll('[data-setting]:not([data-ignore])');

        // mozSettings does not support multiple keys in the cset object
        // with one set() call,
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=779381
        var lock = settings.createLock();
        for (var i = 0; i < fields.length; i++) {
          var input = fields[i];
          var cset = {};
          var key = input.dataset.setting;
          switch (input.type) {
            case 'radio':
              if (input.checked)
                cset[key] = input.value;
              break;
            case 'checkbox':
                cset[key] = input.checked;
              break;
            default:
              cset[key] = input.value;
              break;
          }
          lock.set(cset);
        }
      }
    }

    reset(); // preset all fields before opening the dialog
    openDialog(dialogID, submit);
  },

  getSupportedLanguages: function settings_getLanguages(callback) {
    if (!callback)
      return;

    if (this._languages) {
      callback(this._languages);
    } else {
      var self = this;
      var LANGUAGES = '/shared/resources/languages.json';
      loadJSON(LANGUAGES, function loadLanguages(data) {
        if (data) {
          self._languages = data;
          callback(self._languages);
        }
      });
    }
  },

  loadPanelStylesheetsIfNeeded: function settings_loadPanelStylesheetsIN() {
    var self = this;
    if (self._panelStylesheetsLoaded) {
      return;
    }

    LazyLoader.load(['shared/style/action_menu.css',
                     'shared/style/buttons.css',
                     'shared/style/confirm.css',
                     'shared/style/input_areas.css',
                     'shared/style_unstable/progress_activity.css',
                     'style/apps.css',
                     'style/phone_lock.css',
                     'style/simcard.css',
                     'style/updates.css',
                     'style/downloads.css'],
    function callback() {
      self._panelStylesheetsLoaded = true;
    });
  }
};

// apply user changes to 'Settings' + panel navigation
window.addEventListener('load', function loadSettings() {
  window.removeEventListener('load', loadSettings);
  window.addEventListener('change', Settings);

  navigator.addIdleObserver({
    time: 3,
    onidle: Settings.loadPanelStylesheetsIfNeeded.bind(Settings)
  });

  Settings.init();

  setTimeout(function nextTick() {
    LazyLoader.load(['js/utils.js'], startupLocale);

    LazyLoader.load(['shared/js/wifi_helper.js'], displayDefaultPanel);

    LazyLoader.load([
      'js/airplane_mode.js',
      'js/battery.js',
      'shared/js/async_storage.js',
      'js/storage.js',
      'js/try_show_homescreen_section.js',
      'shared/js/mobile_operator.js',
      'shared/js/icc_helper.js',
      'shared/js/settings_listener.js',
      'js/connectivity.js',
      'js/security_privacy.js',
      'js/icc_menu.js',
      'js/nfc.js',
      'js/dsds_settings.js'
    ], handleRadioAndCardState);
  });

  function displayDefaultPanel() {
    // With async pan zoom enable, the page starts with a viewport
    // of 980px before beeing resize to device-width. So let's delay
    // the rotation listener to make sure it is not triggered by fake
    // positive.
    ScreenLayout.watch(
      'tabletAndLandscaped',
      '(min-width: 768px) and (orientation: landscape)');
    window.addEventListener('screenlayoutchange', Settings.rotate);

    // display of default panel(#wifi) must wait for
    // lazy-loaded script - wifi_helper.js - loaded
    if (Settings.isTabletAndLandscape()) {
      Settings.currentPanel = Settings.defaultPanelForTablet;
    }
  }

  /**
   * Enable or disable the menu items related to the ICC card relying on the
   * card and radio state.
   */
  function handleRadioAndCardState() {
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
      // Note: mobileConnections[0].iccId being null could mean there is no ICC
      // card or the ICC card is locked. If locked we would need to figure out
      // how to check the current card state.
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
        // Airplane is enabled. Well, radioState property could be changing but
        // let's disable the items during the transitions also.
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
  }
});

// back button = close dialog || back to the root page
// + prevent the [Return] key to validate forms
window.addEventListener('keydown', function handleSpecialKeys(event) {
  if (Settings.currentPanel != '#root' &&
      event.keyCode === event.DOM_VK_ESCAPE) {
    event.preventDefault();
    event.stopPropagation();

    var dialog = document.querySelector('#dialogs .active');
    if (dialog) {
      dialog.classList.remove('active');
      document.body.classList.remove('dialog');
    } else {
      Settings.currentPanel = '#root';
    }
  } else if (event.keyCode === event.DOM_VK_RETURN) {
    event.target.blur();
    event.stopPropagation();
    event.preventDefault();
  }
});

// startup & language switching
function startupLocale() {
  navigator.mozL10n.ready(function startupLocale() {
    initLocale();
    // XXX this might call `initLocale()` twice until bug 882592 is fixed
    window.addEventListener('localized', initLocale);
  });
}

function initLocale() {
  var lang = navigator.mozL10n.language.code;

  // set the 'lang' and 'dir' attributes to <html> when the page is translated
  document.documentElement.lang = lang;
  document.documentElement.dir = navigator.mozL10n.language.direction;

  // display the current locale in the main panel
  Settings.getSupportedLanguages(function displayLang(languages) {
    document.getElementById('language-desc').textContent = languages[lang];
  });
}

// Do initialization work that doesn't depend on the DOM, as early as
// possible in startup.
Settings.preInit();
