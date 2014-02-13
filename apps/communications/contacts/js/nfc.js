'use strict';

var contacts = window.contacts || {};

contacts.NFC = (function() {
  console.log('NFC ready');
  var mozNfc = window.navigator.mozNfc;

  var startListening = function() {
    console.log('start listessning!');
    mozNfc.onpeerready = function(e) {
      console.log('-----PEER READY!', e);
    };
  };

  var stopListening = function() {
    console.log('stop listening!');
    mozNfc.onpeerready = null;
  };

  return {
    startListening: startListening,
    stopListening: stopListening
  };
})();
