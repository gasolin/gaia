define(function() {
  'use strict';
  var StackedBar = function(div) {
    var container = div;
    var items = [];
    var totalSize = 0;

    return {
      add: function sb_add(item) {
        totalSize += item.value;
        items.push(item);
      },

      refreshUI: function sb_refreshUI() {
        container.parentNode.hidden = false;
        items.forEach(function(item) {
          var className = 'color-' + item.type;
          var ele = container.querySelector('.' + className);
          if (!ele) {
            ele = document.createElement('span');
            ele.classList.add(className);
            ele.classList.add('stackedbar-item');
            container.appendChild(ele);
          }
          ele.style.width = (item.value * 100) / totalSize + '%';
        });
      },

      reset: function sb_reset() {
        items = [];
        totalSize = 0;
        container.parentNode.hidden = true;
      }
    };
  };

  return StackedBar;
});
