'use strict';

var contacts = window.contacts || {};

contacts.ICE = (function() {
  var iceSettingsPanel,
    iceSettingsBack,
    iceContactItems = [],
    iceContactCheckboxes = [],
    iceContactButtons = [],
    iceScreenLoaded = false,
    ICE_CONTACTS_KEY = 'ice-contacts';

  var init = function ice_init() {
    if (iceScreenLoaded) {
      return;
    }
    // ICE DOM elements
    iceSettingsPanel = document.getElementById('ice-settings');
    iceSettingsBack = document.getElementById('ice-settings-back');

    iceContactItems.push(document.getElementById('ice-contacts-1-switch'));
    iceContactItems.push(document.getElementById('ice-contacts-2-switch'));

    iceContactCheckboxes.push(iceContactItems[0]
                          .querySelector('[name="ice-contact-1-enabled"]'));
    iceContactCheckboxes.push(iceContactItems[1]
                          .querySelector('[name="ice-contact-2-enabled"]'));
    iceContactButtons.push(document.getElementById('select-ice-contact-1'));
    iceContactButtons.push(document.getElementById('select-ice-contact-2'));

    getICEContactsFromInternalStore(setInitialButtonsState);

    // ICE Events handlers
    iceSettingsBack.addEventListener('click', function(){
      contacts.Settings.navigation.back();
    });

    // Temporary logic & listeners, this will be removed or improved
    // in Bug 1042584 in 2.1S1 or S2
    iceContactItems.forEach(function(item, index) {
      item.addEventListener('click', function(i) {
        return function(evt) {
          var status = iceContactCheckboxes[i].checked;
          iceContactCheckboxes[i].checked = !status;
          iceContactButtons[i].disabled = status;
        }
      }(index));
    });

    iceContactButtons.forEach(function(element){
      element.addEventListener('click', function() {
          showSelectList();
      });
    });

    iceScreenLoaded = true;
  };

  var getICEContactsFromInternalStore = function(callback) {
    var iceContactsIds = [
      {
        id: undefined,
        active: false
      },
      {
        id: undefined,
        active: false
      }
    ];

    window.asyncStorage.getItem(ICE_CONTACTS_KEY, function(data) {
      if (data) {
        if (data[0]) {
          iceContactsIds[0] = data[0];
        }
        if (data[1]) {
          iceContactsIds[1] = data[1];
        }
      }
      callback(iceContactsIds);
    });
  };

  var setInitialButtonsState = function(iceContactsIds) {
    var setButtonState = function(id) {

    };
    //for iceContactsIds
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
