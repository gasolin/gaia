'use strict';

/**
 * Debug note: to test this app in a desktop browser, you'll have to set
 * the `dom.mozSettings.enabled' preference to false in order to avoid an
 * `uncaught exception: 2147500033' message (= 0x80004001).
 */

var Settings = {
  get mozSettings() {
    // return navigator.mozSettings when properly supported, null otherwise
    // (e.g. when debugging on a browser...)
    var settings = window.navigator.mozSettings;
    return (settings && typeof(settings.createLock) == 'function') ?
        settings : null;
  },

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
        Settings.navigate(Settings.DEFAULT_TABLET_PANEL_ID);
      }
    }
    Settings._isTabletAndLandscapeLastTime = isTabletAndLandscapeThisTime;
  },

  _transit: function transit(oldPanel, newPanel, callback) {
    if (this.isTabletAndLandscape()) {
      this.PageTransitions.twoColumn(oldPanel, newPanel, callback);
    } else {
      this.PageTransitions.oneColumn(oldPanel, newPanel, callback);
    }
  },

  DEFAULT_TABLET_PANEL_ID: '#wifi',
  DEFAULT_PANEL_ID: '#root',

  _currentPanelId: '#root',

  _currentActivity: null,

  get currentPanelId() {
    return this._currentPanelId;
  },

  navigate: function s_navigate(panelId, options) {
    if (!panelId.startsWith('#')) {
      panelId = '#' + panelId;
    }

    if (panelId == this._currentPanelId) {
      return;
    }

    // If we're handling an activity and the 'back' button is hit,
    // close the activity.
    // XXX this assumes the 'back' button of the activity panel
    //     points to the root panel.
    if (this._currentActivity !== null &&
        panelId === Settings.DEFAULT_PANEL_ID) {
      Settings.finishActivityRequest();
      return;
    }

    if (panelId === Settings.DEFAULT_TABLET_PANEL_ID) {
      PerformanceTestingHelper.dispatch('start');
    }
    var oldPanelId = this._currentPanelId;
    var oldPanel = document.querySelector(this._currentPanelId);
    this._currentPanelId = panelId;
    var newPanelId = this._currentPanelId;
    var newPanel = document.querySelector(this._currentPanelId);

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

  // Early initialization of parts of the application that don't
  // depend on the DOM being loaded.
  preInit: function settings_preInit(
    SettingsCache, PanelHandlers, PageTransitions) {
    var settings = this.mozSettings;
    if (!settings)
      return;

    this.SettingsCache = SettingsCache;
    this.PanelHandlers = PanelHandlers;
    this.PageTransitions = PageTransitions;

    // update corresponding setting when it changes
    settings.onsettingchange =
      this.PanelHandlers.onSettingsChange.bind(this, document);
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
    navigator.mozSetMessageHandler('activity', this.webActivityHandler);

    // preset all inputs that have a `name' attribute
    this.presetPanel();
  },

  loadPanel: function settings_loadPanel(panel, cb) {
    if (!panel) {
      return;
    }

    this.loadPanelStylesheetsIfNeeded();

    // apply the HTML markup stored in the first comment node
    LazyLoader.load([panel], this.afterPanelLoad.bind(this, panel, cb));
  },

  afterPanelLoad: function(panel, cb) {
    this.PanelHandlers.activate(panel);
    if (cb) {
      cb();
    }
  },

  lazyLoad: function settings_lazyLoad(panel) {
    if (panel.dataset.rendered) { // already initialized
      return;
    }
    panel.dataset.rendered = true;

    if (panel.dataset.requireSubPanels) {
      // load the panel and its sub-panels (dependencies)
      // (load the main panel last because it contains the scripts)
      var selector = 'section[id^="' + panel.id + '-"]';
      var subPanels = document.querySelectorAll(selector);
      for (var i = 0, il = subPanels.length; i < il; i++) {
        this.loadPanel(subPanels[i]);
      }
      this.loadPanel(panel, this.panelLoaded.bind(this, panel, subPanels));
    } else {
      this.loadPanel(panel, this.panelLoaded.bind(this, panel));
    }
  },

  panelLoaded: function(panel, subPanels) {
    // preset all inputs in the panel and subpanels.
    if (panel.dataset.requireSubPanels) {
      for (var i = 0; i < subPanels.length; i++) {
        this.presetPanel(subPanels[i]);
      }
    }
    this.presetPanel(panel);
  },

  // Cache of all current settings values.  There's some large stuff
  // in here, but not much useful can be done with the settings app
  // without these, so we keep this around most of the time.
  get settingsCache() {
    return this.SettingsCache.cache;
  },

  // Invoke |callback| with a request object for a successful fetch of
  // settings values, when those values are ready.
  getSettings: function(callback) {
    this.SettingsCache.getSettings(callback);
  },

  presetPanel: function settings_presetPanel(panel) {
    this.PanelHandlers.preset(panel);
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

  webActivityHandler: function settings_handleActivity(activityRequest) {
    var name = activityRequest.source.name;
    var section = 'root';
    Settings._currentActivity = activityRequest;
    switch (name) {
      case 'configure':
        section = activityRequest.source.data.section;

        if (!section) {
          // If there isn't a section specified,
          // simply show ourselve without making ourselves a dialog.
          Settings._currentActivity = null;
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
        setTimeout(function settings_goToSection() {
          Settings.navigate(section);
        });
        break;
      default:
        Settings._currentActivity = null;
        break;
    }

    // Mark the desired panel as a dialog
    if (Settings._currentActivity !== null) {
      var domSection = document.getElementById(section);
      domSection.dataset.dialog = true;
      document.addEventListener('visibilitychange',
        Settings.visibilityHandler);
    }
  },

  handleEvent: function settings_handleEvent(event) {
    this.PanelHandlers.onInputChange(event);
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
                     'shared/style/progress_activity.css',
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
      'shared/js/airplane_mode_helper.js',
      'js/airplane_mode.js',
      'js/battery.js',
      'shared/js/async_storage.js',
      'js/storage.js',
      'js/try_show_homescreen_section.js',
      'shared/js/mobile_operator.js',
      'shared/js/icc_helper.js',
      'shared/js/settings_listener.js',
      'shared/js/toaster.js',
      'js/connectivity.js',
      'js/security_privacy.js',
      'js/icc_menu.js',
      'js/nfc.js',
      'js/dsds_settings.js',
      'js/telephony_settings.js',
      'js/telephony_items_handler.js'
    ], handleTelephonyItems);
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

    // display of default panel(DEFAULT_TABLET_PANEL_ID) must wait for
    // lazy-loaded script - wifi_helper.js - loaded
    if (Settings.isTabletAndLandscape()) {
      Settings.navigate(Settings.DEFAULT_TABLET_PANEL_ID);
    }
  }

  /**
   * Enable or disable the menu items related to the ICC card relying on the
   * card and radio state.
   */
  function handleTelephonyItems() {
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
    TelephonySettingHelper.init();
  }

  // startup
  document.addEventListener('click', Settings.PanelHandlers.onLinkClick);
});

// back button = close dialog || back to the root page
// + prevent the [Return] key to validate forms
window.addEventListener('keydown', function handleSpecialKeys(event) {
  if (Settings.currentPanelId != Settings.DEFAULT_PANEL_ID &&
      event.keyCode === event.DOM_VK_ESCAPE) {
    event.preventDefault();
    event.stopPropagation();

    var dialog = document.querySelector('#dialogs .active');
    if (dialog) {
      dialog.classList.remove('active');
      document.body.classList.remove('dialog');
    } else {
      Settings.navigate(Settings.DEFAULT_PANEL_ID);
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
