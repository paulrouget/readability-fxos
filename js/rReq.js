function rReq(method, action, onSuccess, onError) {
  var BASE_URL = "https://www.readability.com/api/rest/v1/";
  var message = {
    method: method,
    action: BASE_URL + action,
    parameters: [["oauth_signature_method", "PLAINTEXT"]],
  }

  var requestBody = OAuth.formEncode(message.parameters);
  OAuth.completeRequest(message, readability);

  var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
  var xhr = new XMLHttpRequest({mozSystem: true});
  xhr.open(message.method, message.action, true); 
  xhr.setRequestHeader("Authorization", authorizationHeader);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.send(requestBody);

  xhr.addEventListener("load", function() {
    console.log(xhr);
    console.log("load", xhr.responseText);
    if (xhr.status != 200) {
      return onError(xhr.status, "HTTP Error: " + xhr.status);
    }
    try {
      var json = JSON.parse(xhr.responseText);
    } catch(e) {
      return onError(null, "Can't parse: " + xhr.responseText);
    }
    return onSuccess(json);
  }, true);

  xhr.addEventListener("error", function(error) {
    onError("error");
  }, true);
}

var decodeEntities = (function() {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities;
})();
