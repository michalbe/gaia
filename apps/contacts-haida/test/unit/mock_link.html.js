var MockLinkHtml = (function MockLinkHtml() {
  var req = new XMLHttpRequest();
  req.open('GET', '/test/unit/mock_link.html', false);
  req.send(null);

  return req.responseText;
})();
