
'use strict';

const Homescreen = (function() {
  var mgmt = navigator.mozApps.mgmt;
  var grid = document.getElementById('icongrid');
  var page = document.getElementById('landing-page');
  var groupsPage = document.getElementById('groups-page');
  var iconList = document.getElementById('icon-list');
  var groupList = document.getElementById('group-list');
  var HVGA = document.documentElement.clientWidth < 480;
  var mainColor = {r:255, g:255, b:255};
  var currentPossition;
  var currentGroup;
  var groups = [
    {
      name: '',
      content: [
        { name: 'Phone' },
        { name: 'Messages' },
        { name: 'Contacts' },
        { name: 'Facebook' },
        { name: 'Twitter' },
        { name: 'Music' },
        { name: 'Camera' },
        { name: 'Gallery' },
        { name: 'Video' },
        { name: 'FM Radio' },
        { name: 'Email' }
      ]
    },
    {
      name: 'Games',
      content: [
        { name: 'Bad Piggies' },
        { name: 'Letterpress' },
        { name: 'Tetris' },
        { name: 'Solitaire' }
      ]
    },
    { 
      name: 'Tools',
      content : [
        { name: 'Marketplace' },
        { name: 'Settings' },
        { name: 'Cost Control' },
        { name: 'Clock' },
        { name: 'Compass' },
        { name: 'Calculator' },
        { name: 'Calendar' }
      ]
    }
  ]
  var gd = new GestureDetector(grid);
  gd.startDetecting();
  
  grid.addEventListener('transform', function(e) {
    var scale = e.detail.relative.scale;
    if (scale < 1 && !page.classList.contains('hide')) {
      page.classList.add('hide');
    } else if (scale > 1 && page.classList.contains('hide')) {
      page.classList.remove('hide');
    }
  });
  
  var tileSize = 142;
  var tileClass = 'app-tile';
  var longTilesOffset = 0;

  var updateCss = function updateCss() {
    var file = 'style/homescreen.css';
    var style = document.querySelector('link[href*="' + file + '"]');
    if (style) {
      style.href = '/' + file + '?reload=' + new Date().getTime();
    }
  }

  var scrollToGroup = function(e) {
    var scrollTo = e.target.dataset.scrollTo || e.target.parentNode.dataset.scrollTo;
    page.scrollTop = scrollTo;
    page.classList.remove('hide');
  }
  
  var createGroup = function(name) {
    currentGroup = document.createElement('li');
    groupList.appendChild(currentGroup);
    currentPossition = -1;
    
    currentGroup.addEventListener('tap', scrollToGroup);
    
    var group = document.createElement('li');
    group.innerHTML = '<img src="style/images/line.png" /><div>' + name.toUpperCase() + '</div>';
    group.classList.add('title');
    groupList.insertBefore(group, currentGroup);
    
    var title = document.createElement('li');
    title.innerHTML = '<img src="style/images/line.png" /><div>' + name.toUpperCase() + '</div>';
    title.classList.add('title');
    iconList.appendChild(title);
    
    currentGroup.dataset.scrollTo = title.getBoundingClientRect().top;
    
    if (name === '') {
      currentGroup.dataset.scrollTo = 0;
      title.style.display = 'none';
      group.style.display = 'none';
    }
  }
  
  var els = ['menu', 'menutext'];
  for (var i=0; i < els.length; i++) {
    window.navigator.mozSettings.addObserver('gaia.ui.'+els[i], updateCss);
  };
      
  var addManifestToApp = function (app) {
    var name = app.manifest.name;
    groups.forEach(function(group) {
      group.content.forEach(function(appInGroup) {
        if (appInGroup.name === name) {
          appInGroup.app = app;
        } else if (app.manifest["entry_points"]) {
          for (var entry in app.manifest["entry_points"]) {
            if (appInGroup.name === app.manifest.entry_points[entry].name) {
              appInGroup.app = app;
              appInGroup.entry = entry;
            }
          }
        }
      });
    });
  }
  
  var req = mgmt.getAll();
  req.onsuccess = function(e) {
    var apps = req.result;
    for (var i=0, l=apps.length; i<l; i++) {
      addManifestToApp(apps[i]);
    }
    
    groups.forEach(function(group) {
      createGroup(group.name);
      group.content.forEach(function(application) {
        var entry = application.entry || null;
        renderIcon(application, entry);
      });
    });
  }

  var renderIcon = function(application, entryPoint) {
    if (application.app) {
      var app  = application.app;
    } else {
      var app = { manifest: { name: application.name }};
    }
    var name, icon;
    if (entryPoint !== null) {
      name = app.manifest.entry_points[entryPoint].name;
    } else {
      name = app.manifest.name;
    }
    
    icon = window.location.protocol + '//' + 
      window.location.host + '/style/icons/' + application.name.replace(' ', '') + '.png';

    var tile = document.createElement('li');
    var iconImage = new Image();
    var iconGroupImage = new Image();
    
    iconImage.src = iconGroupImage.src = icon;
    currentGroup.appendChild(iconGroupImage);
    
    tile.appendChild(iconImage);
    tile.innerHTML += name;
    tile.addEventListener('tap', (function(application, entry) {
      return function(){ 
<<<<<<< HEAD
        page.addEventListener('transitionend', function runAppTrans() {
          application.launch(entry ? entry : null);
          page.removeEventListener('transitionend', runAppTrans);
          setTimeout(function() {
            page.classList.remove('show');
          }, 500);
        });
=======
        application.launch(entry ? entry : null);
        page.removeEventListener('transitionend', runAppTrans);
        setTimeout(function() {
          page.classList.remove('show');
        }, 500);
>>>>>>> ce50339533791019a36ac7fe564a887ba66d4942
        page.classList.add('show');
      }
    })(app, entryPoint));

    iconList.appendChild(tile);
  }
})();

