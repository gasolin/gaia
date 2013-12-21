define('panels/RootPanel', ['modules/Panel'], function (Panel) {
  var _ready = function(root, options) {
    this.__proto__.ready(root, options);
  };

  var panel = {
    ready: _ready
  };
  panel.__proto__ = Panel();

  return panel;
});
