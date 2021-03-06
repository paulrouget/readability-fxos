(function() {
  var location = document.location.toString();
  var p = location.match(/\?(.*)/);
  if (p && p[1]) {
    var parameters = {};
    var elements = p[1].split('&');
    elements.forEach(function(p) {
      var values = p.split('=');
      parameters[values[0]] = values[1];
    });
    window.opener.postMessage(parameters, "*");
  }
  window.close();
})();
