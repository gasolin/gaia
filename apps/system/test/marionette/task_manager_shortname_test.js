'use strict';

var TaskManager = require('./lib/task_manager');
var FakeApp = require('./lib/fakeapp');
var assert = require('assert');

marionette('Task Manager w/Short Name', function() {
  var shortAppOrigin = 'shortnameapp.gaiamobile.org';
  var apps = {};
  apps[shortAppOrigin] = __dirname + '/../apps/shortnameapp';

  var client = marionette.client({
    profile: {
      apps: apps
    },
    desiredCapabilities: { raisesAccessibilityExceptions: true }
  });

  var actions;
  var system;
  var taskManager;
  var shortApp;

  setup(function() {
    actions = client.loader.getActions();
    system = client.loader.getAppClass('system');
    taskManager = new TaskManager(client);

    system.waitForFullyLoaded();

    shortApp = new FakeApp(client, 'app://' + shortAppOrigin);
    shortApp.launch();
    system.goHome();
  });

  suite('show', function() {
    setup(function() {
      shortApp.launch();
      taskManager.show();
    });

    test('should display correct title on card',
    function() {
      assert.equal(taskManager.cards.length, 1);
      var current = taskManager.cards[0];
      var title = client.helper.waitForElement(current.findElement('.title'));
      assert.equal(title.text(), 'Short');
    });
  });

});
