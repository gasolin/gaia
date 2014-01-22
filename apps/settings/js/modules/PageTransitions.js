define(function() {
  'use strict';
  return {
    _sendPanelReady: function _send_panel_ready(oldPanelHash, newPanelHash) {
      var detail = {
        previous: oldPanelHash,
        current: newPanelHash
      };
      var event = new CustomEvent('panelready', {detail: detail});
      window.dispatchEvent(event);
    },
    /** phone size device layout */
    oneColumn: function one_column(oldPanel, newPanel, callback) {
      var self = this;
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
          self._sendPanelReady('#' + oldPanel.id, '#' + newPanel.id);

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
    /** tablet size device layout */
    twoColumn: function two_column(oldPanel, newPanel, callback) {
      oldPanel.className = newPanel.className ? '' : 'previous';
      newPanel.className = 'current';

      this._sendPanelReady('#' + oldPanel.id, '#' + newPanel.id);

      if (callback) {
        callback();
      }
    }
  };
});
