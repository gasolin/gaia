/* global openLink, openDialog */
/**
 * @fileoverview handle panel actions like
 * preset, activate, onLinkClick, onSettingsChange, onInputChange.
 */
define(['modules/settings_cache', 'shared/lazy_loader'],
  function(SettingsCache, LazyLoader) {
  'use strict';
  var _settings = navigator.mozSettings;

  var _activate = function panel_activate(panel) {
    navigator.mozL10n.translate(panel);

    // activate all scripts
    var scripts = panel.getElementsByTagName('script');
    var scripts_src = Array.prototype.map.call(scripts, function(script) {
      return script.getAttribute('src');
    });
    LazyLoader.load(scripts_src);

    var _onclick = function(callback, value) {
      callback(value);
      return false;
    };

    // activate all links
    var rule = 'a[href^="http"], a[href^="tel"], [data-href]';
    var links = panel.querySelectorAll(rule);
    var i, count;

    for (i = 0, count = links.length; i < count; i++) {
      var link = links[i];
      if (!link.dataset.href) {
        link.dataset.href = link.href;
        link.href = '#';
      }
      if (!link.dataset.href.startsWith('#')) { // external link
        link.onclick = _onclick.bind(this, openLink,
                                     link.dataset.href);
      } else if (!link.dataset.href.endsWith('Settings')) { // generic dialog
        link.onclick = _onclick.bind(this, openDialog,
                                     link.dataset.href.substr(1));
      } else { // Settings-specific dialog box
        link.onclick = _onclick.bind(this, Settings.openDialog,
                                     link.dataset.href.substr(1));
      }
    }
  };

  var _preset = function panel_preset(panel) {
    SettingsCache.getSettings(function(result) {
      panel = panel || document;

      // preset all checkboxes
      var rule = 'input[type="checkbox"]:not([data-ignore])';
      var checkboxes = panel.querySelectorAll(rule);
      var i, count, key;
      for (i = 0, count = checkboxes.length; i < count; i++) {
        key = checkboxes[i].name;
        if (key && result[key] !== undefined) {
          checkboxes[i].checked = !!result[key];
        }
      }

      // remove initial class so the swich animation will apply
      // on these toggles if user interact with it.
      setTimeout(function() {
        for (i = 0, count = checkboxes.length; i < count; i++) {
          if (checkboxes[i].classList.contains('initial')) {
            checkboxes[i].classList.remove('initial');
          }
        }
      }, 0);

      // preset all radio buttons
      rule = 'input[type="radio"]:not([data-ignore])';
      var radios = panel.querySelectorAll(rule);
      for (i = 0, count = radios.length; i < count; i++) {
        key = radios[i].name;
        if (key && result[key] !== undefined) {
          radios[i].checked = (result[key] === radios[i].value);
        }
      }

      // preset all text inputs
      rule = 'input[type="text"]:not([data-ignore])';
      var texts = panel.querySelectorAll(rule);
      for (i = 0, count = texts.length; i < count; i++) {
        key = texts[i].name;
        if (key && result[key] !== undefined) {
          texts[i].value = result[key];
        }
      }

      // preset all range inputs
      rule = 'input[type="range"]:not([data-ignore])';
      var ranges = panel.querySelectorAll(rule);
      for (i = 0, count = ranges.length; i < count; i++) {
        key = ranges[i].name;
        if (key && result[key] !== undefined) {
          ranges[i].value = parseFloat(result[key]);
        }
      }

      // preset all select
      var selects = panel.querySelectorAll('select');
      for (i = 0, count = selects.length; i < count; i++) {
        var select = selects[i];
        key = select.name;
        if (key && result[key] !== undefined) {
          var value = result[key];
          var option = 'option[value="' + value + '"]';
          var selectOption = select.querySelector(option);
          if (selectOption) {
            selectOption.selected = true;
          }
        }
      }

      // preset all span with data-name fields
      rule = '[data-name]:not([data-ignore])';
      var spanFields = panel.querySelectorAll(rule);
      for (i = 0, count = spanFields.length; i < count; i++) {
        key = spanFields[i].dataset.name;

        //XXX intentionally checking for the string 'undefined', see bug 880617
        if (key && result[key] && result[key] != 'undefined') {
          // check whether this setting comes from a select option
          // (it may be in a different panel, so query the whole document)
          rule = '[data-setting="' + key + '"] ' +
            '[value="' + result[key] + '"]';
          var option_span = document.querySelector(rule);
          if (option_span) {
            spanFields[i].dataset.l10nId = option_span.dataset.l10nId;
            spanFields[i].textContent = option_span.textContent;
          } else {
            spanFields[i].textContent = result[key];
          }
        } else { // result[key] is undefined
          var _ = navigator.mozL10n.get;
          switch (key) {
            //XXX bug 816899 will also provide 'deviceinfo.software' from
            // Gecko which is {os name + os version}
            case 'deviceinfo.software':
              var text = _('brandShortName') + ' ' +
                result['deviceinfo.os'];
              spanFields[i].textContent = text;
              break;

            //XXX workaround request from bug 808892 comment 22
            //  hide this field if it's undefined/empty.
            case 'deviceinfo.firmware_revision':
              spanFields[i].parentNode.hidden = true;
              break;

            case 'deviceinfo.mac':
              spanFields[i].textContent = _('macUnavailable');
              break;
          }
        }
      }

      // unhide items according to preferences.
      rule = '[data-show-name]:not([data-ignore])';
      var hiddenItems = panel.querySelectorAll(rule);
      for (i = 0; i < hiddenItems.length; i++) {
        key = hiddenItems[i].dataset.showName;
        hiddenItems[i].hidden = !result[key];
      }
    });
  };

  var _onLinkClick = function panel_onLinkClick(event) {
    var target = event.target;
    var href;

    if (target.classList.contains('icon-back')) {
      href = target.parentNode.getAttribute('href');
    } else {
      var nodeName = target.nodeName.toLowerCase();
      if (nodeName != 'a') {
        return;
      }
      href = target.getAttribute('href');
    }
    // skips the following case:
    // 1. no href, which is not panel
    // 2. href is not a hash which is not a panel
    // 3. href equals # which is translated with loadPanel function, they are
    //    external links.
    if (!href || !href.startsWith('#') || href === '#') {
      return;
    }

    Settings.currentPanel = href;
    event.preventDefault();
  };

  var _onSettingsChange = function panel_onSettingsChange(panel, event) {
    var key = event.settingName;
    var value = event.settingValue;
    var i, count;

    // update <span> values when the corresponding setting is changed
    var rule = '[data-name="' + key + '"]:not([data-ignore])';
    var spanField = panel.querySelector(rule);
    if (spanField) {
      // check whether this setting comes from a select option
      var options = panel.querySelector('select[data-setting="' + key + '"]');
      if (options) {
        // iterate option matching
        for (i = 0, count = options.length; i < count; i++) {
          if (options[i] && options[i].value === value) {
            spanField.dataset.l10nId = options[i].dataset.l10nId;
            spanField.textContent = options[i].textContent;
          }
        }
      } else {
        spanField.textContent = value;
      }
    }

    // hide or unhide items
    rule = '[data-show-name="' + key + '"]:not([data-ignore])';
    var item = document.querySelector(rule);
    if (item) {
      item.hidden = !value;
    }

    // update <input> values when the corresponding setting is changed
    var input = panel.querySelector('input[name="' + key + '"]');
    if (!input) {
      return;
    }

    switch (input.type) {
      case 'checkbox':
      case 'switch':
        if (input.checked == value) {
          return;
        }
        input.checked = value;
        break;
      case 'range':
        if (input.value == value) {
          return;
        }
        input.value = value;
        break;
      case 'select':
        for (i = 0, count = input.options.length; i < count; i++) {
          if (input.options[i].value == value) {
            input.options[i].selected = true;
            break;
          }
        }
        break;
    }
  };

  var _onInputChange = function panel_onInputChange(event) {
    var input = event.target;
    var type = input.type;
    var key = input.name;

    //XXX should we check data-ignore here?
    if (!key || !_settings || event.type != 'change') {
      return;
    }

    // Not touching <input> with data-setting attribute here
    // because they would have to be committed with a explicit "submit"
    // of their own dialog.
    if (input.dataset.setting) {
      return;
    }

    var value;
    switch (type) {
      case 'checkbox':
      case 'switch':
        value = input.checked; // boolean
        break;
      case 'range':
        // Bug 906296:
        //   We parseFloat() once to be able to round to 1 digit, then
        //   we parseFloat() again to make sure to store a Number and
        //   not a String, otherwise this will make Gecko unable to
        //   apply new settings.
        value = parseFloat(parseFloat(input.value).toFixed(1)); // float
        break;
      case 'select-one':
      case 'radio':
      case 'text':
      case 'password':
        value = input.value; // default as text
        if (input.dataset.valueType === 'integer') { // integer
          value = parseInt(value);
        }
        break;
    }

    var cset = {}; cset[key] = value;
    _settings.createLock().set(cset);
  };

  return {
    activate: _activate,
    preset: _preset,
    onLinkClick: _onLinkClick,
    onSettingsChange: _onSettingsChange,
    onInputChange: _onInputChange
  };
});
