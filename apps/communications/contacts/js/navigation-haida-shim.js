'use strict';

function navigationStack(currentView) {
  this.back = function() {
    window.top.postMessage('back', location.origin);
  }
}
