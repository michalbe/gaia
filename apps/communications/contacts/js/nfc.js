'use strict';

var contacts = window.contacts || {};

contacts.NFC = (function() {
  console.log('NFC ready');
  var mozNfc = window.navigator.mozNfc;
  var currentContact;
  var vCardContact;
  var mozNfcPeer;

  var startListening = function(contact) {
    currentContact = contact;

    console.log('start listessning!');
    mozNfc.onpeerready = handlePeerReady;
  };

  var stopListening = function() {
    console.log('stop listening!');
    mozNfc.onpeerready = null;
    currentContact = null;
    vCardContact = null;
    mozNfcPeer = null;
  };

  var handlePeerReady = function(event) {
    console.log('elo!!!!!');
    mozNfcPeer = mozNfc.getNFCPeer(event.detail);
        LazyLoader.load('/shared/js/contact2vcard.js', function() {
          console.log('------- vcard module loaded');
          ContactToVcard(
            [currentContact],
            function append(vcard) {
              console.log('------------ vcard ready!');
              vCardContact = vcard;
            },
            function success() {
              console.log('------------ start sending!');
              sendContacts();
            }
          );
        });
  };

  var sendContacts = function() {
     var NDEFRecord = new MozNDEFRecord(
       0x02,
       'text/x-vCard',
       'contact',
       vCardContact
     );

     var res = mozNfcPeer.sendNDEF([NDEFRecord]);
     res.onsuccess = function() {
       console.log('------------------------- successssss');
     };

     res.onerror = function() {
       console.log('------------------------- errorrrrrrr');
     };

   };

  return {
    startListening: startListening,
    stopListening: stopListening
  };
})();
