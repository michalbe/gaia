/* exported navigationStack */

'use strict';

function navigationStack(currentView) {
  return {
    back: function() {
      window.top.postMessage('back', location.origin);
    }
  };
}
