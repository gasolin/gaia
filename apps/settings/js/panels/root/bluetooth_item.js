/**
 * The moudle supports displaying bluetooth information on an element.
 *
 * @module panels/root/bluetooth_item
 */
define(function(require) {
  'use strict';

  var SettingsService = require('modules/settings_service');

  var _debug = false;
  var debug = function() {};
  if (_debug) {
    debug = function bti_debug(msg) {
      console.log('--> [BluetoothItem]: ' + msg);
    };
  }

  /**
   * @alias module:panels/root/bluetooth_item
   * @class BluetoothItem
   * @requires module:modules/bluetooth
   * @param {HTMLElement} element
                          The element displaying the bluetooth information
   * @return {BluetoothItem}
   */
  function BluetoothItem(element) {
    this._enabled = false;
    this._element = element;
    this._boundRefreshMenuDescription =
      this._refreshMenuDescription.bind(this, element);
  }

  BluetoothItem.prototype = {
    /**
     * An instance to maintain that we have created a promise to get Bluetooth
     * module.
     *
     * @access private
     * @memberOf BluetoothItem.prototype
     * @type {Promise}
     */
    _getBluetoothPromise: null,

    /**
     * A promise function to get Bluetooth module.
     *
     * @access private
     * @memberOf BluetoothItem.prototype
     * @type {Promise}
     */
    _getBluetooth: function bt__getBluetooth() {
      if (!this._getBluetoothPromise) {
        this._getBluetoothPromise = new Promise(function(resolve) {
          debug('loading.. modules/bluetooth/bluetooth_context');
          require(['modules/bluetooth/bluetooth_context'], resolve);
        }.bind(this));
      }
      return this._getBluetoothPromise;
    },

    /**
     * Refresh the text based on the Bluetooth module enabled/disabled,
     * paired devices information.
     *
     * @access private
     * @memberOf BluetoothItem.prototype
     * @param {HTMLElement} element
                            The element displaying the bluetooth information
     */
    _refreshMenuDescription: function bt__refreshMenuDescription(element) {
      if (!navigator.mozL10n) {
        return;
      }

      this._getBluetooth().then(function(bluetooth) {
        debug('Got bluetooth context');
        if (bluetooth.enabled) {
          if (bluetooth.numberOfPairedDevices === 0) {
            element.setAttribute('data-l10n-id', 'bt-status-nopaired');
          } else {
            navigator.mozL10n.setAttributes(element, 'bt-status-paired',
              {
                name: bluetooth.firstPairedDeviceName,
                n: bluetooth.numberOfPairedDevices - 1
              });
          }
        } else {
          element.setAttribute('data-l10n-id', 'bt-status-turnoff');
        }
      });
    },

    /**
     * The value indicates whether the module is responding.
     *
     * @access public
     * @memberOf BluetoothItem.prototype
     * @type {Boolean}
     */
    get enabled() {
      return this._enabled;
    },

    set enabled(value) {
      if (this._enabled === value) {
        return;
      }

      this._enabled = value;
      this._getBluetooth().then(function(bluetooth) {
        if (this._enabled) {
          bluetooth.observe('enabled', this._boundRefreshMenuDescription);
          bluetooth.observe('numberOfPairedDevices',
            this._boundRefreshMenuDescription);
          this._boundRefreshMenuDescription();
        } else {
          bluetooth.unobserve('enabled', this._boundRefreshMenuDescription);
          bluetooth.unobserve('numberOfPairedDevices',
            this._boundRefreshMenuDescription);
        }
      }.bind(this));
    },

    /**
     * Navigate new/old Bluetooth panel via version of mozBluetooth API.
     *
     * @access private
     * @memberOf BluetoothItem.prototype
     * @type {Function}
     */
    _navigatePanelWithVersionCheck:
    function bt__navigatePanelWithVersionCheck() {
      // navigate new bluetooth panel..
      debug('navigate bluetooth panel');
      SettingsService.navigate('bluetooth');
    }
  };

  return function ctor_bluetoothItem(element) {
    return new BluetoothItem(element);
  };
});
