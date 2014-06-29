"use strict";

importScripts("promise-worker.js");
importScripts("sha1.js");
importScripts("oauth.js");

/* Enable log(msg) */

var log = function() { }
self.addEventListener("connect", function onFirstConnection(e) {
  removeEventListener("connect", onFirstConnection);
  var port = e.ports[0];
  port.start();
  log = function(msg) {
    port.postMessage({consoleMessage:msg});
  }
  log("Console bound");
});

/* On connection */

var allPorts = new Set();
self.addEventListener("connect", function(e) {
  var port = e.ports[0];
  allPorts.add(port);
  port.start();
  WorkerWrapper(port, R);
  log("new connection");
});

function notifyAllPorts(msg) {
  for (var p of allPorts) {
    p.postMessage(msg);
  }
}

/* Database */

var D = {};

D.Bookmarks = undefined;
D.User = undefined;

var BASE_URL = "https://www.readability.com/api/rest/v1/";
var KEY = "paulrouget";
var SECRET = "LUmTRhdaApJdpcyYQFKfHgzpdSx4dvDr";
var REDIRECT = "http://paulrouget.com/redirect.html";

D.OAuthConfig = {
  redirectURL:  REDIRECT,
  consumerKey: KEY,
  consumerSecret: SECRET,
  serviceProvider: {
    signatureMethod: "HMAC-SHA1",
    requestTokenURL: BASE_URL + "oauth/request_token/",
    userAuthorizationURL: BASE_URL + "oauth/authorize/",
    accessTokenURL: BASE_URL + "oauth/access_token/"
  }
}

function ensureAuthentificated() {
  if (!R.isAuthentificated()) {
    throw new Error("No authentificated");
  }
}

var initPromise;
var R = {
  init: function() {
    if (initPromise) {
      return initPromise;
    }
    initPromise = R.loadData();
    return initPromise;
  },

  loadData: function() {
    // FIXME
  },

  saveData: function() {
    // FIXME
  },

  clearData: function() {
    // FIXME
  },

  isAuthentificated: function() {
    return ("tokenSecret" in D.OAuthConfig);
  },

  getAuthorizationURL: function() {
    return new Promise(function(resolve, reject) {
      var message = {
        method: "post",
        action: D.OAuthConfig.serviceProvider.requestTokenURL,
        parameters: [["oauth_signature_method", "PLAINTEXT"]],
      };

      var requestBody = OAuth.formEncode(message.parameters);
      OAuth.completeRequest(message, D.OAuthConfig);
      var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
      var xhr = new XMLHttpRequest({mozSystem: true});
      xhr.open(message.method, message.action, true);
      xhr.setRequestHeader("Authorization", authorizationHeader);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send(requestBody);

      xhr.addEventListener("load", function () {
        var results = OAuth.decodeForm(xhr.responseText);
        var token = OAuth.getParameter(results, "oauth_token");
        D.OAuthConfig.tokenSecret = OAuth.getParameter(results, "oauth_token_secret");
        var redirect = encodeURIComponent(REDIRECT);
        var nextURL = D.OAuthConfig.serviceProvider.userAuthorizationURL + "?oauth_token=" + token + "&oauth_callback=" + redirect;
        resolve(nextURL);
      });

      xhr.addEventListener("error", function () {
        reject();
      });
    });
  },

  onUserAuthorized: function(data) {
    return new Promise(function(resolve, reject) {
      if (!data.oauth_callback_confirmed) {
        return reject("Refused by user");
      }

      var message = {
        method: "post",
        action: D.OAuthConfig.serviceProvider.accessTokenURL,
        parameters: [["oauth_signature_method", "PLAINTEXT"]],
      };

      D.OAuthConfig.token = data.oauth_token;
      D.OAuthConfig.verifier = data.oauth_verifier;

      var requestBody = OAuth.formEncode(message.parameters);
      OAuth.completeRequest(message, D.OAuthConfig);

      var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
      var xhr = new XMLHttpRequest({mozSystem: true});
      xhr.open(message.method, message.action, true); 
      xhr.setRequestHeader("Authorization", authorizationHeader);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send(requestBody);

      xhr.addEventListener("load", function() {
        var pairs = xhr.responseText.split("&");
        var res = {};
        for (var pair of pairs) {
          var [name, value] = pair.split("=");
          res[name] = value;
        }
        D.OAuthConfig.tokenSecret = res.oauth_token_secret;
        D.OAuthConfig.token = res.oauth_token;
        R.saveData();
        resolve();
      });

      xhr.addEventListener("error", function() {
        reject();
      });
    });
  },

  getUser: function() {
    ensureAuthentificated();
    if (D.User) {
      return D.User;
    }
    return new Promise(function(resolve, reject) {
      rReq("get", "users/_current").then(json => {
        D.User = json;
        R.saveData();
        resolve(D.User);
      }, reject);
    });
  },

  addBookmark: function(url) {
    ensureAuthentificated();
    return new Promise(function(resolve, reject) {
      rReq("post", "bookmarks", {url: url}).then(() => {
        notifyAllPorts("newbookmark");
      }, reject);
    });
  },

  getBookmarks: function() {
    ensureAuthentificated();
    if (D.Bookmarks) {
      return D.Bookmarks;
    }
    return new Promise(function(resolve, reject) {
      rReq("get", "bookmarks").then(json => {
        D.Bookmarks = json.bookmarks;
        var promises = [];
        for (var b of D.Bookmarks) {
          (function(b) {
            promises.push(new Promise(function(resolve, reject) {
              rReq("get", "articles/" + b.article.id).then(json => {
                b.article.content = json.content;
                resolve();
              }, () => {
                b.article.content = "No content found";
                resolve();
              });
            }));
          })(b);
        }
        Promise.all(promises).then(() => {
          R.saveData();
          resolve(D.Bookmarks)
        }, reject);
      });
    });
  },
}


function rReq(method, action, params) {
  return new Promise(function(resolve, reject) {
    var message = {
      method: method,
      action: BASE_URL + action,
      parameters: [["oauth_signature_method", "PLAINTEXT"]],
    }

    if (params) {
      for (var k in params) {
        message.parameters.push([k, params[k]]);
      }
    }

    var requestBody = OAuth.formEncode(message.parameters);
    OAuth.completeRequest(message, D.OAuthConfig);

    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
    var xhr = new XMLHttpRequest({mozSystem: true});
    xhr.open(message.method, message.action, true);
    xhr.setRequestHeader("Authorization", authorizationHeader);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    log(requestBody);
    xhr.send(requestBody);

    xhr.addEventListener("load", function() {
      if (xhr.status != 200) {
        reject(xhr.status, "HTTP Error: " + xhr.status);
      }
      try {
        var json = JSON.parse(xhr.responseText);
      } catch(e) {
        reject(null, "Can't parse: " + xhr.responseText);
      }
      resolve(json);
    }, true);

    xhr.addEventListener("error", function(error) {
      reject(null, "error: " + error);
    }, true);
  });
}
