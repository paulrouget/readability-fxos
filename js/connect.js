window.onload = function() {
  var loginButton = document.querySelector("#loginButton");
  loginButton.addEventListener("click", getToken);
}

var BASE_URL = "https://www.readability.com/api/rest/v1/";
var KEY = "paulrouget";
var SECRET = "LUmTRhdaApJdpcyYQFKfHgzpdSx4dvDr";
var REDIRECT = "http://paulrouget.com/redirect.html";

var readability = {
  consumerKey   : KEY,
  consumerSecret: SECRET,
  serviceProvider: {
    signatureMethod     : "HMAC-SHA1",
    requestTokenURL     : BASE_URL + "oauth/request_token/",
    userAuthorizationURL: BASE_URL + "oauth/authorize/",
    accessTokenURL      : BASE_URL + "oauth/access_token/"
  }
};

function getToken() {

  // Step 1: request token

  var message = {
    method: "post",
    action: readability.serviceProvider.requestTokenURL,
    parameters: [["oauth_signature_method", "PLAINTEXT"]],
  };

  var requestBody = OAuth.formEncode(message.parameters);    
  OAuth.completeRequest(message, readability);
  var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
  var xhr1 = new XMLHttpRequest({mozSystem: true});
  xhr1.open(message.method, message.action, true); 
  xhr1.setRequestHeader("Authorization", authorizationHeader);
  xhr1.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr1.send(requestBody);

  // Step 2: get secret token, open connection screen from readability.com

  xhr1.addEventListener("load", function () {
    var results = OAuth.decodeForm(xhr1.responseText);
    var token = OAuth.getParameter(results, "oauth_token");
    readability.tokenSecret = OAuth.getParameter(results, "oauth_token_secret");
    var redirect = encodeURIComponent(REDIRECT);
    var nextURL = readability.serviceProvider.userAuthorizationURL + "?oauth_token=" + token + "&oauth_callback=" + redirect;
    window.addEventListener("message", onMessageFromDialog, true);
    window.open(nextURL, "", "dialog");
  });

  xhr1.addEventListener("error", function () {
    window.alert("Error");
  });

  // Step 3: access token

  function onMessageFromDialog(event) {
      console.log("onMessage", event.data);
      window.removeEventListener("message", onMessageFromDialog, true);
      var data = event.data;
      if (!data.oauth_callback_confirmed) {
        window.alert("Refused by user");
        return;
      }

      var message = {
        method: "post",
        action: readability.serviceProvider.accessTokenURL,
        parameters: [["oauth_signature_method", "PLAINTEXT"]],
      };

      readability.token = data.oauth_token;
      readability.verifier = data.oauth_verifier;

      var requestBody = OAuth.formEncode(message.parameters);
      OAuth.completeRequest(message, readability);

      var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
      var xhr2 = new XMLHttpRequest({mozSystem: true});
      xhr2.open(message.method, message.action, true); 
      xhr2.setRequestHeader("Authorization", authorizationHeader);
      xhr2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr2.send(requestBody);

      xhr2.addEventListener("load", function() {
        console.log(xhr2.responseText);
        console.log(readability);
        var pairs = xhr2.responseText.split("&");
        var res = {};
        for (var pair of pairs) {
          var [name, value] = pair.split("=");
          res[name] = value;
        }
        readability.tokenSecret = res.oauth_token_secret;
        readability.token = res.oauth_token;
        // Finally...
        localStorage.readability = JSON.stringify(readability);
        console.log("Registered");
        document.location = "index.html";
      });

      xhr2.addEventListener("error", function() {
        window.alert("Error");
      });
    }
}
