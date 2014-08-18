'use strict';

var contacts = window.contacts || {};

contacts.ICE = (function() {
  var iceSettingsPanel,
    iceSettingsBack,
    iceContactItem1,
    iceContactItem2,
    iceContactCheckbox1,
    iceContactCheckbox2,
    iceContactButton1,
    iceContactButton2,
    iceScreenLoaded = false;

  var init = function ice_init() {
    if (iceScreenLoaded) {
      return;
    }
    // ICE DOM elements
    iceSettingsPanel = document.getElementById('ice-settings');
    iceSettingsBack = document.getElementById('ice-settings-back');

    iceContactItem1 = document.getElementById('ice-contacts-1-switch');
    iceContactItem2 = document.getElementById('ice-contacts-2-switch');
    iceContactCheckbox1 = iceContactItem1
                          .querySelector('[name="ice-contact-1-enabled"]');
    iceContactCheckbox2 = iceContactItem2
                          .querySelector('[name="ice-contact-2-enabled"]');
    iceContactButton1 = document.getElementById('select-ice-contact-1');
    iceContactButton2 = document.getElementById('select-ice-contact-2');

    // ICE Events handlers
    iceSettingsBack.addEventListener('click', function(){
      contacts.Settings.navigation.back();
    });

    // Temporary logic & listeners, this will be removed or improved
    // in Bug 1042584 in 2.1S1 or S2
    iceContactItem1.addEventListener('click', function(){
      var status = iceContactCheckbox1.checked;
      iceContactCheckbox1.checked = !status;
      iceContactButton1.disabled = status;
    });
    iceContactItem2.addEventListener('click', function(){
      var status = iceContactCheckbox2.checked;
      iceContactCheckbox2.checked = !status;
      iceContactButton2.disabled = status;
    });
    [iceContactButton1, iceContactButton2].forEach(function(element){
      element.addEventListener('click', function(){
          showSelectList();
      });
    });
    iceScreenLoaded = true;
  };

  var showSelectList = function showSelectList() {
    contacts.Settings.navigation.go('view-contacts-list', 'right-left');

    //addButton.classList.add('hide');
    contacts.List.clearClickHandlers();
    contacts.List.handleClick(setAsICEContact);
  };

  var setAsICEContact = function(id) {
    console.log('ID', id);
    contacts.Settings.navigation.back();
  };

  return {
    init: init,
    get loaded() { return iceScreenLoaded; }
  };
})();
