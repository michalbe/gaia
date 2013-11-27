'use strict';

var MockContactsIndexHtml = (function MockLinkHtml() {
  var req = new XMLHttpRequest();
  req.open('GET', '/test/unit/mock_contacts_index.html', false);
  req.send(null);

  return req.responseText;
})();
