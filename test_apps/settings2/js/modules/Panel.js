define('modules/Panel', ['modules/SettingsService', 'modules/SettingsCache'],
  function(SettingsService, SettingsCache) {
    var _settings = navigator.mozSettings;

    var _activate = function panel_activate(panel) {
      navigator.mozL10n.translate(panel);

      // activate all scripts
      var scripts = panel.getElementsByTagName('script');
      var scripts_src = Array.prototype.map.call(scripts, function(script) {
        return script.getAttribute('src');
      });
      LazyLoader.load(scripts_src);

      // activate all links
      var self = this;
      var rule = 'a[href^="http"], a[href^="tel"], [data-href]';
      var links = panel.querySelectorAll(rule);
      for (var i = 0, il = links.length; i < il; i++) {
        var link = links[i];
        if (!link.dataset.href) {
          link.dataset.href = link.href;
          link.href = '#';
        }
        if (!link.dataset.href.startsWith('#')) { // external link
          link.onclick = function() {
            //openLink(this.dataset.href);
            console.error('not implemented');
            return false;
          };
        } else if (!link.dataset.href.endsWith('Settings')) { // generic dialog
          link.onclick = function() {
            //openDialog(this.dataset.href.substr(1));
            console.error('not implemented');
            return false;
          };
        } else { // Settings-specific dialog box
          link.onclick = function() {
            //self.openDialog(this.dataset.href.substr(1));
            console.error('not implemented');
            return false;
          };
        }
      }
    };

    var _preset = function panel_preset(panel) {
      SettingsCache.getSettings(function(result) {
        panel = panel || document;

        // preset all checkboxes
        var rule = 'input[type="checkbox"]:not([data-ignore])';
        var checkboxes = panel.querySelectorAll(rule);
        for (var i = 0; i < checkboxes.length; i++) {
          var key = checkboxes[i].name;
          if (key && result[key] != undefined) {
            checkboxes[i].checked = !!result[key];
          }
        }

        // remove initial class so the swich animation will apply
        // on these toggles if user interact with it.
        setTimeout(function() {
          for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].classList.contains('initial')) {
              checkboxes[i].classList.remove('initial');
            }
          }
        }, 0);

        // preset all radio buttons
        rule = 'input[type="radio"]:not([data-ignore])';
        var radios = panel.querySelectorAll(rule);
        for (i = 0; i < radios.length; i++) {
          var key = radios[i].name;
          if (key && result[key] != undefined) {
            radios[i].checked = (result[key] === radios[i].value);
          }
        }

        // preset all text inputs
        rule = 'input[type="text"]:not([data-ignore])';
        var texts = panel.querySelectorAll(rule);
        for (i = 0; i < texts.length; i++) {
          var key = texts[i].name;
          if (key && result[key] != undefined) {
            texts[i].value = result[key];
          }
        }

        // preset all range inputs
        rule = 'input[type="range"]:not([data-ignore])';
        var ranges = panel.querySelectorAll(rule);
        for (i = 0; i < ranges.length; i++) {
          var key = ranges[i].name;
          if (key && result[key] != undefined) {
            ranges[i].value = parseFloat(result[key]);
          }
        }

        // preset all select
        var selects = panel.querySelectorAll('select');
        for (var i = 0, count = selects.length; i < count; i++) {
          var select = selects[i];
          var key = select.name;
          if (key && result[key] != undefined) {
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
        for (i = 0; i < spanFields.length; i++) {
          var key = spanFields[i].dataset.name;

          if (key && result[key] && result[key] != 'undefined') {
            // check whether this setting comes from a select option
            // (it may be in a different panel, so query the whole document)
            rule = '[data-setting="' + key + '"] ' +
              '[value="' + result[key] + '"]';
            var option = document.querySelector(rule);
            if (option) {
              spanFields[i].dataset.l10nId = option.dataset.l10nId;
              spanFields[i].textContent = option.textContent;
            } else {
              spanFields[i].textContent = result[key];
            }
          } else { // result[key] is undefined
            switch (key) {
              //XXX bug 816899 will also provide 'deviceinfo.software' from
              // Gecko which is {os name + os version}
              case 'deviceinfo.software':
                var _ = navigator.mozL10n.get;
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
                var _ = navigator.mozL10n.get;
                spanFields[i].textContent = _('macUnavailable');
                break;
            }
          }
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

      SettingsService.navigate(href.slice(1));
      event.preventDefault();
    };

    var _onSettingsChange = function panel_onSettingsChange(panel, event) {
      var key = event.settingName;
      var value = event.settingValue;

      // update <span> values when the corresponding setting is changed
      var rule = '[data-name="' + key + '"]:not([data-ignore])';
      var spanField = panel.querySelector(rule);
      if (spanField) {
        // check whether this setting comes from a select option
        var options = panel.querySelector('select[data-setting="' + key + '"]');
        if (options) {
          // iterate option matching
          var max = options.length;
          for (var i = 0; i < max; i++) {
            if (options[i] && options[i].value === value) {
              spanField.dataset.l10nId = options[i].dataset.l10nId;
              spanField.textContent = options[i].textContent;
            }
          }
        } else {
          spanField.textContent = value;
        }
      }

      // update <input> values when the corresponding setting is changed
      var input = panel.querySelector('input[name="' + key + '"]');
      if (!input)
        return;

      switch (input.type) {
        case 'checkbox':
        case 'switch':
          if (input.checked == value)
            return;
          input.checked = value;
          break;
        case 'range':
          if (input.value == value)
            return;
          input.value = value;
          break;
        case 'select':
          for (var i = 0; i < input.options.length; i++) {
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
      if (!key || !_settings || event.type != 'change')
        return;

      // Not touching <input> with data-setting attribute here
      // because they would have to be committed with a explicit "submit"
      // of their own dialog.
      if (input.dataset.setting)
        return;

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
          if (input.dataset.valueType === 'integer') // integer
            value = parseInt(value);
          break;
      }

      var cset = {}; cset[key] = value;
      _settings.createLock().set(cset);
    };

    var _emptyFunc = function panel_emptyFunc() {};

    var Panel = function(_init, _uninit, _ready, _done) {
      var _initialized = false;
      var _panel = null;
      var _settingsChangeHandler = function(event) {
        if (_panel) {
          _onSettingsChange(event, _panel);
        }
      };

      var _addListeners = function panel_addListeners(panel) {
        if (!panel)
          return;

        SettingsCache.addEventListener('settingsChange',
          _settingsChangeHandler);
        panel.addEventListener('change', _onInputChange);
        panel.addEventListener('click', _onLinkClick);
      };

      var _removeListeners = function panel_removeListeners(panel) {
        if (!panel)
          return;

        SettingsCache.removeEventListener('settingsChange',
          _settingsChangeHandler);
        panel.removeEventListener('change', _onInputChange);
        panel.removeEventListener('click', _onLinkClick);
      };

      _init = _init || _emptyFunc;
      _uninit = _uninit || _emptyFunc;
      _ready = _ready || _emptyFunc;
      _done = _done || _emptyFunc;

      return {
        init: function(panel, options) {
          if (_initialized)
            return;
          _initialized = true;

          _panel = panel;
          _activate(panel);

          _init(panel, options);
        },
        uninit: function() {
          if (!_initialized)
            return;
          _initialized = false;

          _removeListeners(_panel);
          _panel = null;

          _uninit();
        },
        ready: function(panel, options) {
          this.init(panel, options);

          // Preset the panel every time when it is presented.
          _preset(panel);
          _addListeners(panel);

          _ready(panel, options);
        },
        done: function() {
          // Remove listeners.
          _removeListeners(_panel);

          _done();
        }
      };
    };
    return Panel;
});
