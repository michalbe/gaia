'use strict';

var Rocketbar = {
  /**
   * Initialise rocketbar.
   */
  init: function rocketbar_init() {
    this.progress = document.getElementById('progress');
    this.bar = document.getElementById('rocketbar');
    this.input = document.getElementById('rocketbar-input');
    this.results = document.getElementById('rocketbar-results');
    this.input.addEventListener('focus', this.handleFocus.bind(this));
    this.input.addEventListener('blur', function() {
      setTimeout(this.handleBlur.bind(this));
    }.bind(this));
    this.input.addEventListener('keyup', this.handleKeyUp.bind(this));
    this.bar.addEventListener('submit', this.handleSubmit.bind(this));
    this.results.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('utilitytrayshow',
      this.handleUtilityTrayShow.bind(this));
    window.addEventListener('historychange',
      this.handleWindowChange.bind(this));
  },

  handleUtilityTrayShow: function rocketbar_handleUtilityTrayShow(evt) {
    this.results.innerHTML = '';
    this.input.focus();
  },
  
  currentWindow: null,
  currentTitle: null,
  currentLocation: null,
  
  /**
   * Handle rocketbar focus.
   *
   * @param Event evt The focus event.
   */
  handleFocus: function rocketbar_handleFocus(evt) {
    // Don't show app:// URLs of packaged apps
    if (this.currentLocation.indexOf('app://') == -1) {
      this.input.value = this.currentLocation;
    } else {
      this.input.value = '';
    }
    this.input.select();
  },
  
  /**
   * Handle rocketbar blur.
   *
   * @param Event evt Blur event
   */
  handleBlur: function rocketbar_handleBlur(evt) {
    if (this.currentTitle) {
      this.input.value = this.currentTitle;
    } else if (this.currentLocation.indexOf('app://') == -1) {
      this.input.value = this.currentLocation;
    } else {
      this.input.value = '';
    }
  },
  
  /**
   * Handle rocketbar key presses.
   *
   * @param Event evt The keyup event
   */
  handleKeyUp: function rocketbar_handleKeyUp(evt) {
    var results = [];
    
    // Clean up the query and display blank results if blank
    var query = this.input.value.toLowerCase().trim();
    if (query.length == 0) {
      this.showResults(results);
      return;
    }
    
    // Create a list of manifestURLs for apps with names which match the query
    var installedApps = Applications.installedApps;
    var manifestURLs = Object.keys(installedApps);
    manifestURLs.forEach(function(manifestURL) {
      if (this.HIDDEN_APPS.indexOf(manifestURL) == -1) {
        console.log('MANIFEST ' + manifestURL);
      }
      var appName = installedApps[manifestURL].manifest.name.toLowerCase();
      if (appName.indexOf(query) != -1 &&
          this.HIDDEN_APPS.indexOf(manifestURL) == -1) {
        results.push(manifestURL);
      }
    }, this);
    this.showResults(results);
  },
  
  /**
   * Handle clicks on rocketbar results.
   *
   * @param Event evt Click event
   */
  handleClick: function rocketbar_handleClick(evt) {
    var manifestURL = evt.target.getAttribute('data-manifest-url');
    if (Applications.installedApps[manifestURL])
      Applications.installedApps[manifestURL].launch();
    UtilityTray.hide();
  },
  
  /**
   * Handle submitting the rocketbar.
   *
   * @param Event evt The submit event
   */
  handleSubmit: function rocketbar_handleSubmit(evt) {
    evt.preventDefault();
    UtilityTray.hide();
    
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
    
    var e = new CustomEvent('mozbrowseropenwindow', { bubbles: true, detail: {url: input }});
    this.input.dispatchEvent(e);
  },
  
  /**
   * Show rocketbar results for a list of app manifest URLs.
   *
   * @param Array results An array of app manifest URLs
   */
  showResults: function rocketbar_showResults(results) {
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
   * Handle window history change event.
   *
   * @param Event evt Window history change event.
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
    this.setLoading(history.loading);
    history.ontitlechange = this.setTitle.bind(this);
    history.onlocationchange = this.setLocation.bind(this);
    history.onstatuschange = this.setLoading.bind(this);
  },
  
  /**
   * Set rocketbar title.
   *
   * @param String title Page title
   */
  setTitle: function rocketbar_setTitle(title) {
    this.currentTitle = title;
    if (!this.input.hasFocus) {
      this.input.value = title;
    }
  },
  
  /**
   * Set rocketbar location.
   *
   * @param String URL
   */
  setLocation: function rocketbar_setLocation(location) {
    this.currentTitle = '';
    this.currentLocation = location;
    this.input.value = location;
  },
  
  setLoading: function rocketbar_setLoading(status) {
    if (status) {
      this.progress.classList.add('loading');
    } else {
      this.progress.classList.remove('loading');
    }
  },
  
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
  
  HIDDEN_APPS: ["app://keyboard.gaiamobile.org/manifest.webapp","app://wallpaper.gaiamobile.org/manifest.webapp","app://bluetooth.gaiamobile.org/manifest.webapp","app://pdfjs.gaiamobile.org/manifest.webapp","app://homescreen.gaiamobile.org/manifest.webapp","app://system.gaiamobile.org/manifest.webapp","app://image-uploader.gaiamobile.org/manifest.webapp","http://keyboard.gaiamobile.org:8080/manifest.webapp","http://wallpaper.gaiamobile.org:8080/manifest.webapp","http://bluetooth.gaiamobile.org:8080/manifest.webapp","http://pdfjs.gaiamobile.org:8080/manifest.webapp","http://homescreen.gaiamobile.org:8080/manifest.webapp","http://system.gaiamobile.org:8080/manifest.webapp","http://image-uploader.gaiamobile.org/manifest.webapp"]
}

window.addEventListener('load', function rocketbar_onLoad() {
  window.removeEventListener('load', rocketbar_onLoad);
  Rocketbar.init();
});

/*window.addEventListener('historychange', function rocketbar_onHistoryChange(e) {
  var history = e.detail.current;

  history.title;
  history.ontitlechange = function(title) {
  };

  history.location;
  history.onlocationchange = function(location) {
  };

  history.loading;
  history.onstatuschange = function(loading) {
  };

  history.canGoBack;
  history.oncangoback = function(canGoBack) {
  }

  history.type; //certified, privileged, hosted, remote
  
  var evt = new CustomEvent('mozbrowseropenwindow', { bubbles: true, detail: {url: your_url }});
  this.input.dispatchEvent(evt);
});*/
