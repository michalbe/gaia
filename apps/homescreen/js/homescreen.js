
'use strict';

const Homescreen = (function() {

  var threshold = window.innerWidth / 3;
  var searchFrame = document.querySelector('#search > iframe');

  /*
   * This component deals with the transitions between landing and grid pages
   */
  var ViewController = {

    /*
     * Initializes the component
     *
     * @param {Object} The homescreen container
     */
    init: function vw_init(container) {
      this.currentPage = 1;
      this.pages = container.children;
      this.total = this.pages.length;
      container.addEventListener('mousedown', this);
    },

    /*
     * Navigates to a section given the number
     *
     * @param {int} number of the section
     *
     * @param {int} duration of the transition
     */
    navigate: function vw_navigate(number, duration) {
      var total = this.total;
      for (var n = 0; n < total; n++) {
        var page = this.pages[n];
        var style = page.style;
        style.MozTransform = 'translateX(' + (n - number) + '00%)';
        style.MozTransition = duration ? ('-moz-transform ' + duration + 's ease') : '';
      }

      // Temporaty send an event to the embedded search when it is show hidden
      var details = {
        type: 'visibilitychange',
        data: {
          hidden: number ? false : true
        }
      }
      searchFrame.contentWindow.postMessage(details, '*');

      this.currentPage = number;
      PaginationBar.update(number);
    },

    /*
     * Implements the transition of sections following the finger
     *
     * @param {int} x-coordinate
     *
     * @param {int} duration of the transition
     */
    pan: function vw_pan(x, duration) {
      var currentPage = this.currentPage;
      var total = this.total;
      for (var n = 0; n < total; n++) {
        var page = this.pages[n];
        var style = page.style;
        var calc = (n - currentPage) * 100 + '% + ' + x + 'px';

        style.MozTransform = 'translateX(-moz-calc(' + calc + '))';
        style.MozTransition = duration ? ('-moz-transform ' + duration + 's ease') : '';
      }
    },

    /*
     * Event handling for the homescreen
     *
     * @param {Object} The event object from browser
     */
    handleEvent: function vw_handleEvent(evt) {
      switch (evt.type) {
        case 'mousedown':
          this.onStart(evt);
          break;
        case 'mousemove':
          this.onMove(evt);
          break;
        case 'mouseup':
          this.onEnd(evt);
          break;
      }
    },

    /*
     * Listens mousedown events
     *
     * @param {Object} the event
     */
    onStart: function vw_onStart(evt) {
      evt.preventDefault();
      this.startX = evt.pageX;
      window.addEventListener('mousemove', this);
      window.addEventListener('mouseup', this);
    },

    /*
     * Listens mousemove events
     *
     * @param {Object} the event
     */
    onMove: function vw_onMove(evt) {
      this.pan(-(this.startX - evt.pageX), 0);
    },

    /*
     * Listens mouseup events
     *
     * @param {Object} the event
     */
    onEnd: function vw_onEnd(evt) {
      window.removeEventListener('mousemove', this);
      window.removeEventListener('mouseup', this);
      var diffX = evt.pageX - this.startX;
      var dir = 0; // Keep the position
      if (diffX > threshold && this.currentPage > 0) {
        dir = -1; // Previous
      } else if (diffX < -threshold && this.currentPage < this.total - 1) {
        dir = 1; // Next
      }
      this.navigate(this.currentPage + dir, 0.2);
    }
  };

  var host = document.location.host;
  var domain = host.replace(/(^[\w\d]+\.)?([\w\d]+\.[a-z]+)/, '$2');

  PaginationBar.init('.paginationScroller');

  function initUI() {
    DockManager.init(document.querySelector('#footer'));
    GridManager.init('.apps', function gm_init() {
      PaginationBar.update(1);
      PaginationBar.show();
      ViewController.init(document.querySelector('#content'));
      DragDropManager.init();
    });
  }

  function start() {
    if (Applications.isReady()) {
      initUI();
    } else {
      Applications.addEventListener('ready', initUI);
    }
  }

  HomeState.init(function success(onUpgradeNeeded) {
    if (onUpgradeNeeded) {
      // First time the database is empty -> Dock by default
      var appsInDockByDef = ['browser', 'dialer', 'music', 'gallery'];
      appsInDockByDef = appsInDockByDef.map(function mapApp(name) {
        return 'http://' + name + '.' + domain;
      });
      HomeState.saveShortcuts(appsInDockByDef, start, start);
    } else {
      start();
    }
  }, start);

  // XXX Currently the home button communicate only with the
  // system application. It should be an activity that will
  // use the system message API.

  var footer = document.getElementById('footer');
  var search = document.getElementById('search');

  window.addEventListener('message', function onMessage(e) {
    var json = JSON.parse(e.data);
    var mode = json.type;

    switch (mode) {
      case 'home':
        if (appFrameIsActive) {
          closeApp();
        } else if (document.body.dataset.mode === 'edit') {
          document.body.dataset.mode = 'normal';
          GridManager.saveState();
          DockManager.saveState();
          Permissions.hide();
        } else if (ViewController.currentPage === 1 &&
                   GridManager.getCurrentPage() === 0) {
          GridManager.goTo(0, function finish() {
            ViewController.navigate(0, 0.2);
          });
        } else {
          GridManager.goTo(0, function finish() {
            ViewController.navigate(1, 0.2);
          });
        }
        break;
      case 'open-in-app':
        openApp(json.data.url);
        break;
      case 'add-bookmark':
        installApp(json.data.title, json.data.url, json.data.icon);
        break;
    }
  });

  var appFrameIsActive = false;

  var frame = document.getElementById('app-frame');
  function openApp(url) {
    // This is not really fullscreen, do we expect fullscreen?
    frame.classList.add('visible');
    if (ViewController.currentPage === 0) {
      search.classList.add('hidden');
      footer.classList.add('hidden');
      var details = {
        type: 'visibilitychange',
        data: {
          hidden: true
        }
      };
      searchFrame.contentWindow.postMessage(details, '*');
    }

    frame.addEventListener('transitionend', function onStopTransition(e) {
      frame.removeEventListener('transitionend', onStopTransition);
      frame.src = url;
    });

    appFrameIsActive = true;
  }

  function closeApp() {
    frame.classList.remove('visible');
    if (search.classList.contains('hidden')) {
      var details = {
        type: 'visibilitychange',
        data: {
          hidden: false
        }
      };
      searchFrame.contentWindow.postMessage(details, '*');
      search.classList.remove('hidden');
      footer.classList.remove('hidden');
    }

    frame.addEventListener('transitionend', function onStopTransition(e) {
      frame.removeEventListener('transitionend', onStopTransition);
      frame.src = 'about:blank';
    });

    appFrameIsActive = true;

    appFrameIsActive = false;
  }

  function installApp(title, url, icon) {
    var app = {
      name: title,
      origin: url,
      icon: icon
    };
    ViewController.navigate(1, 0.2);
    GridManager.install(app, true);
  }

  // Listening for installed apps
  Applications.addEventListener('install', function oninstall(app) {
    GridManager.install(app, true);
  });

  // Listening for uninstalled apps
  Applications.addEventListener('uninstall', function onuninstall(app) {
    if (DockManager.contains(app)) {
      DockManager.uninstall(app);
    } else {
      GridManager.uninstall(app);
    }
  });

  return {
    /*
     * Displays the contextual menu given an origin
     *
     * @param {String} the app origin
     */
    showAppDialog: function h_showAppDialog(origin) {
      // FIXME: localize this message
      var app = Applications.getByOrigin(origin);
      var title = 'Remove ' + app.manifest.name;
      var body = 'This application will be uninstalled fully from your mobile';
      Permissions.show(title, body,
                       function onAccept() { app.uninstall() },
                       function onCancel() {});
    },

    openApp: openApp,

    isIcongridInViewport: function h_isIcongridInViewport() {
      return ViewController.currentPage === 1;
    }
  };
})();
