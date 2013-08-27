requireApp('communications/contacts/js/export/sd.js');

mocha.globals(['ContactToVcardBlob', '_']);
suite('Sd export', function() {

  var subject;
  var realDeviceStorage = null;
  var c1 = {}, c2 = {}, c3 = {}, c4 = {};
  var updateSpy = null;
  var progressMock = function dummy() {};
  var realContactToVcardBlob = null;
  var real_ = null;
  var storage = null;

  suiteSetup(function() {
    // Device storage mock
    realDeviceStorage = navigator.getDeviceStorage;
    var deviceStorageAddNamed = function(contact, filename) {
      var self = this;
      return {
        set onsuccess(cb) {
          self.calledCount++;
          if (!self.faulty || self.calledCount % 2 != 0) {
            cb();
          }
        },
        set onerror(cb) {
          self.calledCount++;
          if (self.faulty && self.calledCount % 2 == 0) {
            cb();
          }
        }
      };
    };

    navigator.getDeviceStorage = function() {
      var obj = {
        'calledCount': 0,
        'faulty': false,
        'addNamed': deviceStorageAddNamed
      };
      return obj;
    };

    // L10n mock
    real_ = window._;
    window._ = function() {};
  });

  suiteTeardown(function() {
    navigator.getDeviceStorage = realDeviceStorage;
    window._ = real_;
  });

  setup(function() {
    subject = new ContactsSDExport();
    subject.setProgressStep(progressMock);

    realContactToVcardBlob = window.ContactToVcardBlob;
    window.ContactToVcardBlob = function() {};
    updateSpy = this.sinon.stub(
      window,
      'ContactToVcardBlob',
      function(contact, callback) {
        callback(contact[0]);
      }
    );

    storage = subject.getStorage();
    storage.faulty = false;
  });

  teardown(function() {
    window.ContactToVcardBlob = realContactToVcardBlob;
  });

  test('Calling with 1 contact', function(done) {
    subject.setContactsToExport([c1]);

    subject.doExport(function onFinish(error, total, exported, msg) {
      assert.equal(false, subject.hasDeterminativeProgress());
      assert.equal(1, window.ContactToVcardBlob.callCount);
      assert.isNull(error);
      assert.equal(1, exported);
      assert.equal(1, total);
      done();
    });
  });

  test('Calling with several contacts', function(done) {
    var contacts = [c1, c2];
    subject.setContactsToExport(contacts);

    subject.doExport(function onFinish(error, total, exported, msg) {
      assert.ok(subject.hasDeterminativeProgress());
      assert.equal(contacts.length, updateSpy.callCount);
      assert.isNull(error);
      assert.equal(contacts.length, exported);
      assert.equal(contacts.length, total);
      done();
    });
  });

  test('Recovering from error in progress', function(done) {
    var contacts = [c1, c2, c1, c2];
    subject.setContactsToExport(contacts);
    subject.setProgressStep(function faultyProgress() {
      var count = 0;

      var doFaultyProgress = function doFaultyProgress() {
        count++;
        if (count % 2 == 0) {
          throw new Exception('Im a faulty progress');
        }
      };

      return doFaultyProgress();
    }());

    subject.doExport(function onFinish(error, total, exported, msg) {
      assert.ok(subject.hasDeterminativeProgress());
      assert.equal(contacts.length, updateSpy.callCount);
      // We do have an error this time
      assert.isNotNull(error);
      // The progress fails, but the real process of exporting
      // continues
      assert.equal(contacts.length, exported);
      assert.equal(contacts.length, total);
      done();
    });
  });

  test('Recovering from error writing to DeviceStorage', function(done) {
    var contacts = [c1, c2, c3, c4];
    subject.setContactsToExport(contacts);

    storage.faulty = true;

    subject.doExport(function onFinish(error, total, exported, msg) {
      assert.ok(subject.hasDeterminativeProgress());
      assert.equal(contacts.length, updateSpy.callCount);
      // We do not have an error
      assert.isNull(error);
      // The number of exported contacts is not the total
      assert.equal(contacts.length / 2, exported);
      assert.equal(contacts.length, total);
      done();
    });
  });
});
