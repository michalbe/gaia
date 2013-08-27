var ContactsSDExport = function ContactsSDExport() {

  var contacts;
  var progressStep;
  var sdcard = navigator.getDeviceStorage('sdcard');
  var exported = [];
  var notExported = [];

  var setContactsToExport = function setContactsToExport(cts) {
    contacts = cts;
  };

  var hasDeterminativeProgress = function hasDeterminativeProgress() {
    return contacts.length > 1;
  };

  var setProgressStep = function setProgressStep(p) {
    progressStep = p;
  };

  var getExportTitle = function getExportTitle() {
    return _('sdExport-title');
  };

  var hasName = function hasName(contact) {
    return (Array.isArray(contact.givenName) && contact.givenName[0] &&
              contact.givenName[0].trim()) ||
            (Array.isArray(contact.familyName) && contact.familyName[0] &&
              contact.familyName[0].trim());
  };

  var getFileName = function getFileName(contact) {
    var filename = [];

    if (hasName(contact)) {
      filename.push(contact.givenName[0], contact.familyName[0]);
    } else {
      if (contact.org && contact.org.length > 0) {
        filename.push(contact.org[0]);
      } else if (contact.tel && contact.tel.length > 0) {
        filename.push(contact.tel[0].value);
      } else if (contact.email && contact.email.length > 0) {
        filename.push(contact.email[0].value);
      } else {
        filename.push(_('noName'));
      }
    }

    return filename.join('_')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase() +
      '.vcard';
  };

  var doExport = function doExport(finishCallback) {
    if (typeof finishCallback !== 'function') {
      throw new Error('SD export requires a callback function');
    }

    // Cover the whole process under a try/catch to
    // prevent inconsistent states caused by unexpected
    // errors and return back the control to the
    // generic exporter
    try {
      _doExport(0, finishCallback);
    } catch (e) {
      finishCallback({
        'reason': e.name
      }, contacts.length, exported.length, e.message);
    }
  };

  var _doExport = function _doExport(step, finishCallback) {
    if (step == contacts.length) {
      finishCallback(null, contacts.length, exported.length, null);
      return;
    }

    var next = function next(success, contact) {
      var resultArray = success ? exported : notExported;
      resultArray.push(contact);
      if (progressStep) {
        progressStep();
      }
      step++;
      _doExport(step, finishCallback);
    };

    var theContact = contacts[step];

    // var request = icc.updateContact('adn', theContact);
    ContactToVcardBlob([theContact], function(vcard) {
      var request = sdcard.addNamed(vcard, getFileName(theContact));
      request.onsuccess = function onsuccess() {
        next(true, theContact);
      };
      request.onerror = function onerror(e) {
        // Don't send an error, just continue
        next(false, theContact);
      };
    });
  };

  return {
    'setContactsToExport': setContactsToExport,
    'shouldShowProgress': function() { return true },
    'hasDeterminativeProgress': hasDeterminativeProgress,
    'getExportTitle': getExportTitle,
    'doExport': doExport,
    'setProgressStep': setProgressStep,
    'getStorage': function sdExport_getStorage() { return sdcard; }
  };

};
