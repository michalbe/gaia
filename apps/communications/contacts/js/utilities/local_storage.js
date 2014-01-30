'use strict';

//
// Utility API for storing config in localStorage, used to broadcast
// the event to all the windows in the app in Haida.
//
// DON'T USE IT ON STARTUP OF THE APP.
//
var utils = window.utils = window.utils || {};
if (!utils.localStorage) {
  utils.localStorage = (function() {
    var KEY = 'preferences';
    var registerForStorageEvent = function(callback) {
      window.addEventListener('storage', function(e) {
        if (e.key === KEY) {
          callback(JSON.parse(e.newValue));
        }
      });
    };

    var updateStorage = function(value) {
      window.localStorage.setItem(KEY, value);
    };

    return {
      register: registerForStorageEvent,
      update: updateStorage
    };
  }());
}
