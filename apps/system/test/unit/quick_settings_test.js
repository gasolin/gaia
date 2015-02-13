'use strict';
/* global MockL10n */
/* global MockNavigatorMozMobileConnections */
/* global MockNavigatorSettings */
/* global MocksHelper */
/* global MockSettingsListener */
/* global MockWifiManager */
/* global QuickSettings */


require('/test/unit/mock_activity.js');
require('/shared/test/unit/mocks/mock_l10n.js');
require('/test/unit/mock_wifi_manager.js');
require('/shared/test/unit/mocks/mock_settings_helper.js');
require('/shared/test/unit/mocks/mock_settings_listener.js');
require('/shared/test/unit/mocks/mock_navigator_moz_settings.js');
require('/shared/test/unit/mocks/mock_navigator_moz_mobile_connections.js');
require('/shared/test/unit/mocks/mock_navigator_moz_bluetooth_v2.js');

require('/js/quick_settings.js');

function switchReadOnlyProperty(originObject, propName, targetObj) {
  Object.defineProperty(originObject, propName, {
    configurable: true,
    get: function() { return targetObj; }
  });
}

var mocksForQuickSettings = new MocksHelper([
  'MozActivity',
  'SettingsHelper',
  'SettingsListener',
  'NavigatorMozMobileConnections'
]).init();

suite('quick settings > ', function() {
  var realWifiManager;
  var realL10n;
  var realSettings;
  var realMozMobileConnections;
  var realMozBluetooth
  var fakeQuickSettingsNode;
  var realAirplaneMode;
  var subject;

  mocksForQuickSettings.attachTestHelpers();

  suiteSetup(function() {
    realWifiManager = navigator.mozWifiManager;
    navigator.mozWifiManager = MockWifiManager;
    realSettings = navigator.mozSettings;
    navigator.mozSettings = MockNavigatorSettings;
    realL10n = navigator.mozL10n;
    navigator.mozL10n = MockL10n;
    realMozMobileConnections = navigator.mozMobileConnections;
    navigator.mozMobileConnections = MockNavigatorMozMobileConnections;
    realMozBluetooth = navigator.mozBluetooth;
    switchReadOnlyProperty(navigator, 'mozBluetooth', MockMozBluetooth);
  });

  suiteTeardown(function() {
    navigator.mozWifiManager = realWifiManager;
    navigator.MozMobileConnections = realMozMobileConnections;
    navigator.mozL10n = realL10n;
    navigator.mozSettings = realSettings;
    window.AirplaneMode = realAirplaneMode;
    switchReadOnlyProperty(navigator, 'mozBluetooth', realMozBluetooth);
  });

  setup(function() {
    MockNavigatorMozMobileConnections.mAddMobileConnection();

    fakeQuickSettingsNode = document.createElement('div');
    fakeQuickSettingsNode.id = 'quick-settings';
    document.body.appendChild(fakeQuickSettingsNode);

    subject = new QuickSettings();

    subject.ELEMENTS.forEach(function testAddElement(elementName) {
      var elt = document.createElement('div');
      elt.id = 'quick-settings-' + elementName;
      fakeQuickSettingsNode.appendChild(elt);
    });
    subject.start();
  });

  teardown(function() {
    fakeQuickSettingsNode.parentNode.removeChild(fakeQuickSettingsNode);
  });

  test('system/quick settings/enable wifi: Connected', function() {
    MockWifiManager.connection.status = 'connected';
    subject.handleEvent({
      type: 'click',
      target: subject.wifi,
      preventDefault: function() {}
    });
    subject.handleEvent({
      type: 'wifi-statuschange',
      preventDefault: function() {}
    });
    assert.equal(
      MockNavigatorSettings.mSettings['wifi.connect_via_settings'], true);
  });

  test('system/quick settings/enable wifi: Connecting failed', function() {
    MockWifiManager.connection.status = 'connectingfailed';
    subject.handleEvent({
      type: 'click',
      target: subject.wifi,
      preventDefault: function() {}
    });
    subject.handleEvent({
      type: 'wifi-statuschange',
      preventDefault: function() {}
    });
    assert.equal(
      MockNavigatorSettings.mSettings['wifi.connect_via_settings'], false);
  });

  test('system/quick settings/enable wifi: Disconnected', function() {
    MockWifiManager.connection.status = 'disconnected';
    subject.handleEvent({
      type: 'click',
      target: subject.wifi,
      preventDefault: function() {}
    });
    subject.handleEvent({
      type: 'wifi-statuschange',
      preventDefault: function() {}
    });
    assert.equal(
      MockNavigatorSettings.mSettings['wifi.connect_via_settings'], false);
  });

  test('system/quick settings/disable wifi', function() {
    MockSettingsListener.mCallbacks['wifi.enabled'](true);
    subject.handleEvent({
      type: 'click',
      target: subject.wifi,
      preventDefault: function() {}
    });
    assert.equal(
      MockNavigatorSettings.mSettings['wifi.connect_via_settings'], false);
  });

  test('system/quick settings/enable airplane mode', function() {
    MockSettingsListener.mCallbacks['airplaneMode.status']('enabled');
    this.sinon.stub(window, 'dispatchEvent');
    subject.handleEvent({
      type: 'click',
      target: subject.airplaneMode,
      preventDefault: function() {}
    });
    assert.equal(
      subject.airplaneMode.dataset.enabled, 'true');

    assert.equal(
      subject.data.classList.contains(
        'quick-settings-airplane-mode'), true);

    assert.isTrue(window.dispatchEvent.called);
    assert.equal(window.dispatchEvent.getCall(0).args[0].type,
      'request-airplane-mode-disable');
  });

  test('system/quick settings/disable airplane mode', function() {
    MockSettingsListener.mCallbacks['airplaneMode.status']('disabled');
    this.sinon.stub(window, 'dispatchEvent');
    subject.handleEvent({
      type: 'click',
      target: subject.airplaneMode,
      preventDefault: function() {}
    });
    assert.equal(
      subject.airplaneMode.dataset.enabled, undefined);

    assert.equal(
      subject.data.classList.contains(
        'quick-settings-airplane-mode'), false);

    assert.isTrue(window.dispatchEvent.called);
    assert.equal(window.dispatchEvent.getCall(0).args[0].type,
      'request-airplane-mode-enable');
  });

  suite('datachange > ', function() {
    var label = {
      'lte': '4G', // 4G LTE
      'ehrpd': '4G', // 4G CDMA
      'hspa+': 'H+', // 3.5G HSPA+
      'hsdpa': 'H', 'hsupa': 'H', 'hspa': 'H', // 3.5G HSDPA
      // 3G CDMA
      'evdo0': '3G', 'evdoa': '3G', 'evdob': '3G', '1xrtt': '3G',
      'umts': '3G', // 3G
      'edge': 'E', // EDGE
      'is95a': '2G', 'is95b': '2G', // 2G CDMA
      'gprs': '2G'
    };

    function setDataTypeOnConn(index, value) {
      MockNavigatorMozMobileConnections[index].data = {};
      MockNavigatorMozMobileConnections[index].data.type = value;
    }

    suite('one sim has data but the other one doesn\'t', function() {
      setup(function() {
        setDataTypeOnConn(0, 'umts');
        setDataTypeOnConn(1, undefined);
        MockNavigatorMozMobileConnections[0]
          .triggerEventListeners('datachange');
      });

      test('we would get 3G label', function() {
        assert.equal(subject.data.dataset.network, label.umts);
      });
    });

    suite('no sim has data', function() {
      setup(function() {
        setDataTypeOnConn(0, undefined);
        setDataTypeOnConn(1, undefined);
        MockNavigatorMozMobileConnections[0]
          .triggerEventListeners('datachange');
      });

      test('we would get undefined label', function() {
        assert.equal(subject.data.dataset.network, label[undefined] + '');
      });
    });
  });
});
