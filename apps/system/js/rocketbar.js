'use strict';

var Rocketbar = {

  /**
   * DOM elements.
   */
  zone: document.getElementById('top-panel'),
  progress: document.getElementById('progress'),
  bar: document.getElementById('rocketbar'),
  input: document.getElementById('rocketbar-input'),
  results: document.getElementById('rocketbar-results'),
  
  /**
   * Initialise Rocketbar.
   */
  init: function rocketbar_init() {
    this.input.addEventListener('focus', this.handleFocus.bind(this));
    this.input.addEventListener('blur', function() {
      setTimeout(this.handleBlur.bind(this));
    }.bind(this));

    this.input.addEventListener('keyup', this.handleKeyUp.bind(this));
    this.bar.addEventListener('submit', this.handleSubmit.bind(this));

    this.results.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('historychange',
      this.handleWindowChange.bind(this));

    window.addEventListener('lock', (function onLock() {
      this.close(true);
    }).bind(this));

    ['touchstart', 'touchmove', 'touchend'].forEach(function(e) {
      this.zone.addEventListener(e, this);
    }, this);

    Places.init(function(firstRun) {});

    navigator.mozSettings.addObserver('rocketbar.show', function(event) {
      this.open(true);
    }.bind(this));
  },

  lastY: 0,
  startY: 0,

  /**
   * Handle touch events.
   */
  handleEvent: function rocketbar_handleEvent(e) {
    var diffY = this.lastY - this.startY;
    var progress = Math.abs(diffY / (window.innerHeight / 5));

    switch (e.type) {
      case 'touchstart':
        this.lastY = this.startY = e.touches[0].pageY;
        this.lastDate = Date.now();

        this.bar.style.MozTransition = 'transform';
        break;
      case 'touchmove':
        this.lastY = e.touches[0].pageY;
        this.lastProgress = progress;
        this.lastDate = Date.now();

        var translation = -100 + Math.min(progress * 100, 100);

        this.bar.style.MozTransform = 'translateY(' + translation + '%)';

        break;
      case 'touchend':
        if (progress >= 1) {
          this.bar.style.MozTransition = '';
          this.open(true);
        } else {
          var durationLeft = 0.3 - (1 - progress) * 0.3;
          this.bar.style.MozTransition = 'transform ' + durationLeft +
            's linear';
          this.close();
        }

        this.bar.style.MozTransform = '';

        break;
    }
  },

  /**
   * Open the rocketbar.
   *
   * @param {boolean} focus Set focus on rocketbar after opening.
   */
  open: function rocketbar_open(focus) {
    console.log('---------- launched APPS:', WindowManager.runningApps.length);
    
    WindowManager.runningApps.forEach(function(app) {
      console.log('-----', app);
    });
    
    this.results.innerHTML = '';
    this.bar.classList.add('open');

    if (focus) {
      this.input.focus();
      this.results.classList.add('open');
    }

  },

  /**
   * Close the rocketbar.
   *
   * @param {boolean} evenIfFocused Close rocketbar even when focussed if true.
   * @param {function} callback Called after the transition
   */
  close: function rocketbar_close(evenIfFocused, callback) {
    this.progress.classList.remove('loading');

    var focus = (this.input == document.activeElement);
    if (!focus || evenIfFocused) {
      this.results.classList.remove('open');
      this.input.blur();

      var bar = this.bar;
      bar.classList.remove('open');
      bar.addEventListener('transitionend', function trWait() {
        bar.removeEventListener('transitionend', trWait);
        if (callback) {
          callback();
        }
      });
    }
  },

  currentWindow: null,
  currentTitle: null,
  currentLocation: null,

  /**
   * Does the current sheet belong to a packaged app?
   *
   * @return {boolean} True for yes, false for no.
   */
  get currentlyOnPackagedApp() {
    return (this.currentLocation.indexOf('app://') != -1);
  },

  /**
   * Handle rocketbar focus.
   *
   * @param {Event} evt The focus event.
   */
  handleFocus: function rocketbar_handleFocus(evt) {
    // Don't show app:// URLs of packaged apps
    if (!this.currentlyOnPackagedApp) {
      this.input.value = this.currentLocation;
    } else {
      this.input.value = '';
    }
    this.input.select();

    this.results.classList.add('open');
    this._clearEarlyHide();
  },

  /**
   * Handle rocketbar blur.
   *
   * @param {Event} evt Blur event.
   */
  handleBlur: function rocketbar_handleBlur(evt) {
    if (this.currentTitle) {
      this.input.value = this.currentTitle;
    } else if (this.currentlyPackagedOnApp) {
      this.input.value = this.currentLocation;
    } else {
      this.input.value = '';
    }
  },

  /**
   * Handle rocketbar key presses.
   *
   * @param {Event} evt The keyup event.
   */
  handleKeyUp: function rocketbar_handleKeyUp(evt) {
    var results = [];

    // Clean up the query and display blank results if blank
    var query = this.input.value.toLowerCase().trim();
    if (query.length == 0) {
      this.showAppResults(results);
      return;
    }

    // Create a list of manifestURLs for apps with names which match the query
    var installedApps = Applications.installedApps;
    var manifestURLs = Object.keys(installedApps);
    manifestURLs.forEach(function(manifestURL) {
      var appName = installedApps[manifestURL].manifest.name.toLowerCase();
      if (appName.indexOf(query) != -1 &&
          this.HIDDEN_APPS.indexOf(manifestURL) == -1) {
        results.push(manifestURL);
      }
    }, this);
    this.showAppResults(results);
    Places.getTopSites(20, query, this.showSiteResults.bind(this));
  },

  /**
   * Handle clicks on rocketbar results.
   *
   * @param {Event} evt Click event.
   */
  handleClick: function rocketbar_handleClick(evt) {
    var target = evt.target;
    var callback = function() {
      // If app, launch app
      var manifestURL = target.getAttribute('data-manifest-url');
      if (manifestURL && Applications.installedApps[manifestURL]) {
        Applications.installedApps[manifestURL].launch();
      }

      // If site, open site in new sheet
      var siteURL = target.getAttribute('data-site-url');
      if (siteURL) {
        WindowManager.openNewSheet(siteURL);
      }
    };
    
    if (this.currentLocation === 'about:blank') {
      this.results.classList.remove('open');
      this.input.blur();
      callback();
    } else {
      this.close(true, callback);
    }
  },

  /**
   * Handle submitting the rocketbar.
   *
   * @param {Event} evt The submit event.
   */
  handleSubmit: function rocketbar_handleSubmit(evt) {
    evt.preventDefault();

    var input = this.input.value;

    // No protocol, could be a search term
    if (this.isNotURL(input)) {
      input = 'http://google.com' + '/search?q=' + input;
    }

    var httpPattern = /^(?:[a-z\u00a1-\uffff0-9-+]+)(?::|:\/\/)/i;
    var hasScheme = !!(httpPattern.exec(input) || [])[0];
    // No scheme, prepend basic protocol and return
    if (!hasScheme) {
      input = 'http://' + input;
    }

    this.close(true, function() {
      WindowManager.openNewSheet(input);
    });
  },

  /**
   * Show rocketbar results for a list of app manifest URLs.
   *
   * @param {Array} results An array of app manifest URLs.
   */
  showAppResults: function rocketbar_showAppResults(results) {
    this.results.innerHTML = '';
    if (results.length == 0)
      return;
    results.forEach(function(manifestURL) {
      var app = Applications.installedApps[manifestURL];
      var li = document.createElement('li');
      li.textContent = app.manifest.name;
      li.setAttribute('data-manifest-url', manifestURL);
      li.style.backgroundImage = 'url(' + app.origin +
        app.manifest.icons['60'] + ')';
      this.results.appendChild(li);
    }, this);
  },

  /**
   *  Show rocketbar results for a list of places.
   */
  showSiteResults: function rocketbar_showSiteResults(results) {
    console.log(JSON.stringify(results));
    results.forEach(function(result) {
      var resultItem = document.createElement('li');
      var resultTitle = document.createElement('h3');
      var resultURL = document.createElement('small');
      resultTitle.textContent = result.title;
      resultURL.textContent = result.uri;
      resultItem.setAttribute('data-site-url', result.uri);
      resultItem.appendChild(resultTitle);
      resultItem.appendChild(resultURL);
      this.results.appendChild(resultItem);
    }, this);
  },

  /**
   * Handle window history change event.
   *
   * @param {Event} evt Window history change event.
   */
  handleWindowChange: function rocketbar_handleWindowChange(evt) {
    var history = evt.detail.current;
    this.currentWindow = history;
    this.currentLocation = history.location;
    this.currentTitle = history.title;
    if (this.currentTitle) {
      this.input.value = this.currentTitle;
    } else {
      this.input.value = this.currentLocation;
    }

    if (!history.loading) {
      this.close(false);
    } 
    
    if (history.location === 'about:blank') {
      PagesIntro.show();
      this.open();
    } else {
      this.setLoading(history.loading);
      history.ontitlechange = this.setTitle.bind(this);
      history.onstatuschange = this.setLoading.bind(this);
    }
    
  },

  /**
   * Set rocketbar title.
   *
   * @param {string} title Page title.
   */
  setTitle: function rocketbar_setTitle(title) {
    this.currentTitle = title;
    if (!this.input.hasFocus) {
      this.input.value = title;
    }
    if (!this.currentlyOnPackagedApp)
      Places.setPageTitle(this.currentLocation, title);
  },

  /**
   * Set rocketbar location.
   *
   * @param {string} location URL.
   */
  setLocation: function rocketbar_setLocation(location) {
    this.currentTitle = '';
    this.currentLocation = location;
    this.input.value = location === 'about:blank' ? '' : location;
    if (!this.currentlyOnPackagedApp)
      Places.addVisit(location);
  },

  _earlyHideID: null,

  /**
   * Turn loading throbber on and off.
   *
   * @param {boolean} status True for on, false for off.
   */
  setLoading: function rocketbar_setLoading(status) {
    // Just for network activity
    if (this.currentlyOnPackagedApp) {
      return;
    }

    this._clearEarlyHide();

    if (status) {
      this.progress.classList.add('loading');

      this.open(false);
      this._earlyHideID = setTimeout((function() {
        this.close(false);
      }).bind(this), 5000);
    } else {
      this.close(false);
    }
  },

  _clearEarlyHide: function rb_clearEarlyHide() {
    if (this._earlyHideID) {
      clearTimeout(this._earlyHideID);
      this._earlyHideID = null;
    }
  },

  /**
   * Test whether string is a URL.
   *
   * @param {String} input Text to be tested.
   * @return {boolean} True for non-URL, false for URL.
   */
  isNotURL: function rocketbar_isNotURL(input) {
    // NOTE: NotFound is equal to the upper bound of Uint32 (2^32-1)
    var dLoc = input.indexOf('.') >>> 0;
    var cLoc = input.indexOf(':') >>> 0;
    var sLoc = input.indexOf(' ') >>> 0;
    var mLoc = input.indexOf('?') >>> 0;
    var qLoc = Math.min(input.indexOf('"') >>> 0, input.indexOf('\'') >>> 0);

    // Space at 0 index treated as NotFound
    if (sLoc === 0) {
      sLoc = -1 >>> 0;
    }

    // Question Mark at 0 index is a keyword search
    if (mLoc == 0) {
      return true;
    }

    // Space before Dot, Or Quote before Dot
    // Space before Colon, Or Quote before Colon
    // Space before QuestionMark, Or Quote before QuestionMark
    if ((sLoc < dLoc || qLoc < dLoc) &&
        (sLoc < cLoc || qLoc < cLoc) &&
        (sLoc < mLoc || qLoc < mLoc)) {
      return true;
    }

    // NotFound will always be greater then the length
    // If there is no Colon, no Dot and no QuestionMark
    // there is no way this is a URL
    if (cLoc > input.length && dLoc > input.length && mLoc > input.length) {
      return true;
    }
    return false;
  },

  HIDDEN_APPS: ['app://keyboard.gaiamobile.org/manifest.webapp',
    'app://wallpaper.gaiamobile.org/manifest.webapp',
    'app://bluetooth.gaiamobile.org/manifest.webapp',
    'app://pdfjs.gaiamobile.org/manifest.webapp',
    'app://homescreen.gaiamobile.org/manifest.webapp',
    'app://system.gaiamobile.org/manifest.webapp',
    'app://image-uploader.gaiamobile.org/manifest.webapp',
    'app://browser.gaiamobile.org/manifest.webapp',
    'http://keyboard.gaiamobile.org:8080/manifest.webapp',
    'http://wallpaper.gaiamobile.org:8080/manifest.webapp',
    'http://bluetooth.gaiamobile.org:8080/manifest.webapp',
    'http://pdfjs.gaiamobile.org:8080/manifest.webapp',
    'http://homescreen.gaiamobile.org:8080/manifest.webapp',
    'http://system.gaiamobile.org:8080/manifest.webapp',
    'http://image-uploader.gaiamobile.org/manifest.webapp',
    'http://browser.gaiamobile.org:8080/manifest.webapp']
};

window.addEventListener('load', function rocketbar_onLoad() {
  window.removeEventListener('load', rocketbar_onLoad);
  Rocketbar.init();
});
