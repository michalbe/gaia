
'use strict';

const Homescreen = (function() {
  var host = document.location.host;
  var domain = host.replace(/(^[\w\d]+\.)?([\w\d]+\.[a-z]+)/, '$2');

  var mode = 'normal';

  // Initialize the pagination scroller
  PaginationBar.init('.paginationScroller');

  function initUI() {
    // Initialize the dock
    DockManager.init(document.querySelector('#footer'));

    setLocale();
    GridManager.init('.apps', function gm_init() {
      GridManager.goToPage(1);
      PaginationBar.show();
      DragDropManager.init();

      window.addEventListener('localized', function localize() {
        setLocale();
        GridManager.localize();
        DockManager.localize();
      });
    });
  }
  
  // XXX Currently the home button communicate only with the
  // system application. It should be an activity that will
  // use the system message API.

  var footer = document.getElementById('footer');

  window.addEventListener('message', function onMessage(e) {
    var json = JSON.parse(e.data);
    var mode = json.type;

    switch (mode) {
      case 'home':
              if (Homescreen.isInEditMode()) {
                Homescreen.setMode('normal');
                GridManager.saveState();
                DockManager.saveState();
                Permissions.hide();
              } else if (GridManager.pageHelper.getCurrentPageNumber() !== 0) {
                GridManager.goToPage(0);
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
  var appFrame = document.getElementById('app-frame');

  var search = document.getElementById('search');
  var searchFrame = document.querySelector('#search > iframe');

  search.addEventListener('transitionend', function(e) {
    var rect = search.getBoundingClientRect();
    var details = {
      type: 'visibilitychange',
      data: {
        hidden: rect.left === 0 ? false : true
      }
    };
    searchFrame.contentWindow.postMessage(details, '*');
  });

  function openApp(url) {
    // This is not really fullscreen, do we expect fullscreen?
    appFrame.classList.add('visible');
    if (GridManager.pageHelper.getCurrentPageNumber() === 0) {
      search.classList.add('hidden');
      footer.classList.add('hidden');
    }

    appFrame.addEventListener('transitionend', function onStopTransition(e) {
      appFrame.removeEventListener('transitionend', onStopTransition);
      appFrame.src = url;
    });

    appFrameIsActive = true;
  }

  function closeApp() {
    appFrame.classList.remove('visible');
    if (search.classList.contains('hidden')) {
      search.classList.remove('hidden');
      footer.classList.remove('hidden');
    }

    appFrame.addEventListener('transitionend', function onStopTransition(e) {
      appFrame.removeEventListener('transitionend', onStopTransition);
      appFrame.src = 'about:blank';
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
    GridManager.install(app, true);
  }

  function setLocale() {
    // set the 'lang' and 'dir' attributes to <html> when the page is translated
    document.documentElement.lang = navigator.mozL10n.language.code;
    document.documentElement.dir = navigator.mozL10n.language.direction;
  }

  function start() {
    if (Applications.isReady()) {
      initUI();
      return;
    }
    Applications.addEventListener('ready', initUI);
  }

  HomeState.init(function success(onUpgradeNeeded) {
    if (!onUpgradeNeeded) {
      start();
      return;
    }

    // First time the database is empty -> Dock by default
    var appsInDockByDef = ['browser', 'dialer', 'music', 'gallery'];
    var protocol = window.location.protocol;
    appsInDockByDef = appsInDockByDef.map(function mapApp(name) {
      return { type: 'app', origin: protocol + '//' + name + '.' + domain }
    });
    HomeState.saveShortcuts(appsInDockByDef, start, start);
  }, start);

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
    isInEditMode: function() {
      return mode === 'edit';
    },
    setMode: function(newMode) {
      mode = document.body.dataset.mode = newMode;
    }
  };
})();
