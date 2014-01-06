define(function() {
  'use strict';
  return {
    oneColumn: function one_column(oldPanel, newPanel, callback) {
      if (!oldPanel) {
        newPanel.className = 'current';
        if (callback)
          callback();
        return;
      }

      // switch previous/current classes
      oldPanel.className = newPanel.className ? '' : 'previous';
      newPanel.className = 'current';

      /**
       * Most browsers now scroll content into view taking CSS transforms into
       * account.  That's not what we want when moving between <section>s,
       * because the being-moved-to section is offscreen when we navigate to its
       * #hash.  The transitions assume the viewport is always at document 0,0.
       * So add a hack here to make that assumption true again.
       * https://bugzilla.mozilla.org/show_bug.cgi?id=803170
       */
      if ((window.scrollX !== 0) || (window.scrollY !== 0)) {
        window.scrollTo(0, 0);
      }

      newPanel.addEventListener('transitionend', function paintWait() {
        newPanel.removeEventListener('transitionend', paintWait);

        // We need to wait for the next tick otherwise gecko gets confused
        setTimeout(function nextTick() {
          // Bug 818056 - When multiple visible panels are present,
          // they are not painted correctly. This appears to fix the issue.
          // Only do this after the first load
          if (oldPanel.className === 'current')
            return;

          if (callback) {
            callback();
          }
        });
      });
    },
    twoColumn: function two_column(oldPanel, newPanel, callback) {
      if (oldPanel) {
        oldPanel.className = newPanel.className ? '' : 'previous';
      }
      newPanel.className = 'current';

      if (callback) {
        callback();
      }
    }
  };
})
