var NavigationShim = {
  handleEvent: function(event) {
    if (event.type === 'message') {
      console.log('event msg: ', event.data);
      switch (event.data) {
        case 'back':
          Contacts.navigation.back();
          break;
        }
    }
  }
}

window.addEventListener("message", NavigationShim);
