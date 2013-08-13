'use strict';

const Wallpaper = (function() {
  var overlay = document.getElementById('icongrid');

  function onHomescreenContextmenu() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 320;
    canvas.height = 420;
    
    ctx.fillColor = "#000000";
    ctx.fillRect(0, 0, 320, 420);
        // 
        // var a = new MozActivity({
        //   name: 'pick',
        //   data: {
        //     type: 'image/jpeg',
        //     width: 320,
        //     height: 480
        //   }
        // });
        // a.onsuccess = function onWallpaperSuccess() {
        //   if (!a.result.blob)
        //     return;
        // 
        //   var reader = new FileReader();
        //   reader.readAsDataURL(a.result.blob);
        //   reader.onload = function() {
        navigator.mozSettings.createLock().set({
          'wallpaper.image': canvas.toDataURL("image/png")
        });
      //};
    //};

  }

  return {
    init: function init() {
      onHomescreenContextmenu();
    }
  };
})();
