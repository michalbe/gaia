var ThemesHomescreen = (function() {
  var gaiaButton = document.getElementById('gaia-homescreen');
  var balmerButton = document.getElementById('balmer-homescreen');

  var setting = navigator.mozSettings.createLock().get(
    'homescreen.manifestURL'
  );
  setting.onsuccess = function() {
    if (this.result['homescreen.manifestURL'].indexOf('homescreen') > -1) {
      gaiaButton.disabled = 'disabled';
    }

    if (this.result['homescreen.manifestURL'].indexOf('customhs') > -1) {
      balmerButton.disabled = 'disabled';
    }
  };

  gaiaButton.addEventListener('click', function() {
    navigator.mozSettings.createLock().set(
      {
        'homescreen.manifestURL':
          'app://homescreen.gaiamobile.org/manifest.webapp'
      }
    );
    gaiaButton.disabled = 'disabled';
    balmerButton.disabled = '';
    // navigator.mozPower.reboot();
    // ScreenManager.turnScreenOff(true);
    //WindowManager.kill('app://customhs.gaiamobile.org/manifest.webapp');
  });

  balmerButton.addEventListener('click', function() {
    navigator.mozSettings.createLock().set(
      {
        'homescreen.manifestURL':
          'app://customhs.gaiamobile.org/manifest.webapp'
      }
    );
    gaiaButton.disabled = '';
    balmerButton.disabled = 'disabled';
    //WindowManager.kill('app://homescreen.gaiamobile.org/manifest.webapp');
        // navigator.mozPower.reboot();
        // ScreenManager.turnScreenOff(true);
  });

})();
