'use strict';

var MockMozNfc = {
  onpeerready: null,
  getNFCPeer: function(event) {
    return {
      sendNDEF: function(records){}
    }
  }
};
