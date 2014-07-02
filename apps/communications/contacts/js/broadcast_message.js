'use strict';

/* exported messageBroadcaster */

/*
 * This is a temporary shim library for communication between
 * haida-sheets. It will probably not be needed once we will
 * have proper broadcasting messages
 */

var messageBroadcaster = (function() {
  var urlString = window.location.toString();
  var isListening = false;
  var listeners = {};
  var childViews;

  // Top window (main parent with all the iframes) is not always equal to
  // window.top, for instance in Dialer app when we open main contacts window
  // in an iframe, window.top is dialer's main document, and what we are
  // interested in is the content of the iframe, contacts/index.html
  // Since messageBroadcaster works only in contacts there is nothing wrong
  // in hardcoding name of the app here. It should change if we will move
  // it to /shared/ and use in other apps in the future.
  var isTopWindow = !!(
    ~urlString.indexOf('index') &&
    ~urlString.indexOf('contacts')
  );
  var appTopWindow = isTopWindow ? window : window.parent;

  var i;
  var len;

  var msgToEvent = function(msg) {
    // When the message we receive has expected structure...
    if (
      msg &&
      msg.data &&
      msg.data.broadcasted_message &&
      msg.data.broadcasted_data
    ) {
      // it means it's our broadcasting event and we fire it here
      fire(msg.data.broadcasted_message, msg.data.broadcasted_data, true);
    }
  };

  // we use .on() to subscribe for the event
  var on = function(message, cb) {
    // probably some of the views will not need any broadcasting events,
    // so for performance reasons we shouldn't listen to any event inside
    // those iframes.
    //
    // XXX: it would be great to set a data-flag or class on the iframe
    // and exclude it from the childViews, but for now it's not so
    // important - we have only one iframe with child view.
    if (!isListening) {
      window.addEventListener('message', msgToEvent);
      isListening = true;
    }
    // If we don't have any listeners for this message, create an array
    // of listeners (callback function). Like in DOM, every event can fire
    // multiple listeners so Array is good solution in here
    if (typeof listeners[message] === 'undefined') {
      listeners[message] = [];
    }
    // Add another callback function to this event
    listeners[message].push(cb);
  };

  // .fire() emits event
  var fire = function(message, data, calledFromOutside) {
    // if it's not called from outside, it means the event fired in this
    // window. We need to go to the top level then (window.top) and send
    // event to all the child iframes
    if (!calledFromOutside) {
      appTopWindow.postMessage({
        broadcasted_message: message,
        broadcasted_data: data
      }, location.origin);
    } else {
      // If we received the event by post message (so it didn't started in
      // here) and we are in the top window, then we iterate through all the
      // iframes and send them post messages with given data
      if (isTopWindow) {
        for (i = 0, len = childViews.length; i < len; i++) {
          childViews[i].contentWindow.postMessage({
            broadcasted_message: message,
            broadcasted_data: data
          }, '*');
        }
      }
      // And then we evecute all the callback assigned to the given event
      // with broadcasted data
      if (Array.isArray(listeners[message])) {
        var currentListeners = listeners[message];
        for (i = 0, len = currentListeners.length; i < len; i++) {
          if(currentListeners[i]) {
            currentListeners[i](data);
          }
        }
      }
    }
  };

  // We call .out() to unsuscribe from the event.
  var out = function(message, cb) {
    if (Array.isArray(listeners[message])) {
      var currentListeners = listeners[message];
      for (i = 0, len = currentListeners.length; i < len; i++){
        if (currentListeners[i] === cb){
          currentListeners.splice(i, 1);
          break;
        }
      }

      // If we don't have any more events, we don't want to listen to the
      // post message. Except when we are in the top window, then even if
      // we are not interested in any messages, we need somehow send them
      // deeper.
      if (listeners.length === 0 && !isTopWindow) {
        window.removeEventListener('message', msgToEvent);
        isListening = false;
      }
    }
  };

  // Top window should listen to all the events and send the to the child
  // iframes
  if (isTopWindow) {
    isListening = true;
    childViews = document.getElementsByTagName('iframe');
    window.addEventListener('message', msgToEvent);
  }

  return {
    fire: fire,
    on: on,
    out: out
  };

})();
