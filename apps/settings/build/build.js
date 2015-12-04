'use strict';

/* jshint node: true */
/* global dump */
var utils = require('utils');
var jsmin = require('jsmin');
var preprocessor = require('preprocessor');

var jsSuffix = /\.js$/;

var SettingsAppBuilder = function() {
};

SettingsAppBuilder.prototype.RESOURCES_PATH = 'resources';

SettingsAppBuilder.prototype.writeSupportsJSON = function(options) {
  var distDir = options.GAIA_DISTRIBUTION_DIR;

  var file = utils.getFile(options.STAGE_APP_DIR, 'resources', 'support.json');
  var defaultContent = null;
  var content = utils.getDistributionFileContent('support',
                                                  defaultContent, distDir);
  utils.writeContent(file, content);
};

SettingsAppBuilder.prototype.writeDeviceFeaturesJSON = function(options) {
  var distDir = options.GAIA_DISTRIBUTION_DIR;

  var file = utils.getFile(options.STAGE_APP_DIR, 'resources',
                           'device-features.json');
  var defaultContent = {
    ambientLight: true,
    vibration: true,
    usbHotProtocolSwitch: false
  };
  var content = utils.getDistributionFileContent('device-features',
                                                  defaultContent, distDir);
  utils.writeContent(file, content);
};

SettingsAppBuilder.prototype.writeFindMyDeviceConfigJSON = function(options) {
  var distDir = options.GAIA_DISTRIBUTION_DIR;

  var file = utils.getFile(options.STAGE_APP_DIR,
    'resources', 'findmydevice.json');
  var defaultContent = {
    api_url: 'https://find.firefox.com',
    api_version: '1',
  };

  var content = utils.getDistributionFileContent('findmydevice',
                                                  defaultContent, distDir);
  utils.writeContent(file, content);
};

SettingsAppBuilder.prototype.writeEuRoamingJSON = function(options) {
  var distDir = options.GAIA_DISTRIBUTION_DIR;

  var file = utils.getFile(options.STAGE_APP_DIR, 'resources',
                           'eu-roaming.json');
  var defaultContent = {};
  var content = utils.getDistributionFileContent('eu-roaming',
                                                  defaultContent, distDir);
  utils.writeContent(file, content);
};

SettingsAppBuilder.prototype.executeRjs = function(options) {
  var deferred = utils.Q.defer();

  var configFile = utils.getFile(options.APP_DIR, 'build',
    'settings.build.jslike');
  var r = require('r-wrapper').get(options.GAIA_DIR);
  // Simply use r.js for merging scripts as it does not support es6 syntax.
  // Minifying will be done by other tools later.
  r.optimize([configFile.path, 'optimize=none'], function() {
    dump('r.js optimize ok\n');
    deferred.resolve();
  }, function(err) {
    dump('r.js optmize failed:\n');
    dump(err + '\n');
    deferred.resolve();
  });

  return deferred.promise;
};

SettingsAppBuilder.prototype.executeJsmin = function(options) {
  if (options.GAIA_OPTIMIZE === '1') {
    utils.listFiles(options.STAGE_APP_DIR, utils.FILE_TYPE_FILE, true).forEach(
      function(filePath) {
        if (jsSuffix.test(filePath)) {
          try {
            var file = utils.getFile(filePath);
            var content = utils.getFileContent(file);
            utils.writeContent(file, jsmin(content).code);
          } catch(e) {
            utils.log('Error minifying content: ' + filePath);
          }
        }
    });
  }
};

SettingsAppBuilder.prototype.enableDataSync = function(options) {
  var fileList = {
    process:[
      ['elements', 'root.html'],
      ['index.html']
    ],
    remove:[
      ['elements', 'firefox_sync.html'],
      ['js', 'panels', 'firefox_sync', 'firefox_sync.js'],
      ['js', 'panels', 'firefox_sync', 'panel.js'],
      ['js', 'modules', 'sync_manager_bridge.js'],
      ['style', 'images', 'fxsync_error.png'],
      ['style', 'images', 'fxsync_intro.png'],
      ['test', 'unit', 'panels', 'firefox_sync', 'manager_bridge_test.js'],
      ['test', 'unit', 'panels', 'firefox_sync', 'panel_test.js']
    ]
  };
  preprocessor.execute(options, 'FIREFOX_SYNC', fileList);
};

SettingsAppBuilder.prototype.execute = function(options) {
  // this.writeGitCommit(options);
  this.writeDeviceFeaturesJSON(options);
  this.writeSupportsJSON(options);
  this.writeFindMyDeviceConfigJSON(options);
  this.writeEuRoamingJSON(options);

  return this.executeRjs(options).then(function() {
    this.enableDataSync(options);
    this.executeJsmin(options);
  }.bind(this));
};

exports.execute = function(options) {
  return (new SettingsAppBuilder()).execute(options);
};
