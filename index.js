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

checkIfToken();

function checkIfToken() {
  console.log("checkIfToken");
  if (!localStorage.token) {    
    var message = {
      method: "post",
      action: readability.serviceProvider.requestTokenURL,
      parameters: [["oauth_signature_method", "PLAINTEXT"]],
    };

    var requestBody = OAuth.formEncode(message.parameters);    
    OAuth.completeRequest(message, readability);

    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
    var requestToken = new XMLHttpRequest({mozSystem: true});

    function messageFromDialog(event) {
      console.log("onMessage", event.data);
      window.removeEventListener("message", messageFromDialog, true);
      var data = event.data;
      console.log("MESSAGE", data);
      if (!data.oauth_callback_confirmed) {
        // REFUSED
        console.error("Refused");
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
      var accessToken = new XMLHttpRequest({mozSystem: true});
      accessToken.open(message.method, message.action, true); 
      accessToken.setRequestHeader("Authorization", authorizationHeader);
      accessToken.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      accessToken.send(requestBody);

      // FIXME: successful request
      
    }
    requestToken.onreadystatechange = function receiveRequestToken() {
      if (requestToken.readyState == 4) {
        var results = OAuth.decodeForm(requestToken.responseText);
        var token = OAuth.getParameter(results, "oauth_token");
        readability.tokenSecret = OAuth.getParameter(results, "oauth_token_secret");
        var redirect = encodeURIComponent(REDIRECT);
        var nextURL = readability.serviceProvider.userAuthorizationURL + "?oauth_token=" + token + "&oauth_callback=" + redirect;
        window.addEventListener("message", messageFromDialog, true);
        window.open(nextURL, "", "dialog");
      }
    };
    requestToken.open(message.method, message.action, true); 
    requestToken.setRequestHeader("Authorization", authorizationHeader);
    requestToken.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    requestToken.send(requestBody);
  } else {
    onToken();
  }
}

function onToken() {
  console.log("onToken")
  var message = {method: "post", action: BASE_URL + "bookmarks"};
  OAuth.completeRequest(message,
                    { consumerKey   : readability.consumerKey
                    , consumerSecret: readability.consumerSecret
                    , token         : localStorage.oauth_token
                    });

  var xhr = new XMLHttpRequest({mozSystem: true});

  xhr.addEventListener("load", function() {
    console.log(xhr.responseText);
  }, true);

  xhr.addEventListener("error", function(error) {
    console.error(error);
  }, true);

  xhr.open(message.method, message.action, true); 
  xhr.setRequestHeader("Authorization", OAuth.getAuthorizationHeader("", message.parameters));
  xhr.send();
}
