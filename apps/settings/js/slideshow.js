/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

// handle Wi-Fi settings
navigator.mozL10n.ready(function slideShowSettings() {
  var _ = navigator.mozL10n.get;

  var settings = window.navigator.mozSettings;
  if (!settings)
    return;

  var gSlideShowCheckBox = document.querySelector('#slideshow-enabled input');
  var fieldSource = document.getElementById('slideshow-source');
  var fieldDuration = document.getElementById('slideshow-duration');
  var fieldEffect = document.getElementById('slideshow-effect');
  var fieldActivation = document.getElementById('slideshow-activation');

  // activate main button
  gSlideShowCheckBox.onchange = function changeSlideShow() {
    var req = settings.createLock().set({'slideshow.enabled': this.checked});
    this.disabled = true;
    req.onerror = function() {
      gSlideShowCheckBox.disabled = false;
    };
  };

  function setMozSettingsEnabled(value) {
    gSlideShowCheckBox.checked = value;
    gSlideShowCheckBox.disabled = false;
    if (value) {
      // this.fieldSource.hidden = false;
      fieldDuration.hidden = false;
      fieldEffect.hidden = false;
      fieldActivation.hidden = false;
    } else {
      // this.fieldSource.hidden = true;
      fieldDuration.hidden = true;
      fieldEffect.hidden = true;
      fieldActivation.hidden = true;
    }
  }

  var lastMozSettingValue = true;
  // register an observer to monitor slideshow.enabled changes
  settings.addObserver('slideshow.enabled', function(event) {
    if (lastMozSettingValue == event.settingValue)
      return;

    lastMozSettingValue = event.settingValue;
    setMozSettingsEnabled(event.settingValue);
  });

  // startup, update status
  var req = settings.createLock().get('slideshow.enabled');
  req.onsuccess = function ss_getStatusSuccess() {
    lastMozSettingValue = req.result['slideshow.enabled'];
    setMozSettingsEnabled(lastMozSettingValue);
  };

  // settings.addObserver('slideshow.source', function(event) {
  // });

  // settings.addObserver('slideshow.duration', function(event) {
  // });

  // settings.addObserver('slideshow.effect', function(event) {
  // });

  // settings.addObserver('slideshow.activation', function(event) {
  // });

});
