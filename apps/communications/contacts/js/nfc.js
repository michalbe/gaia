var NFC = function() {
  console.log('NFC ready');
  window.navigator.mozNfc.onpeerready = function(e) {
    console.log('-----PEER READY!', e);
  }
}();