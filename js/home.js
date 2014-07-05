/* Utils */

var error = e => alert("Error:" + e);
var $ = q => document.querySelector(q)

/* Worker */

var sw = new SharedWorker("/libs/readability.js");
sw.port.addEventListener("message", function(e) {
  console.log("message:", e.data);
  if (e.data.consoleMessage) {
    console.log("readability.js:", e.data.consoleMessage);
  }
});
sw.port.start();
var ww = WorkerWrapper(sw.port);

/* Init */

window.onload = function() {
  ww.init().then(() => {
    $("button.connect").onclick = OnConnectButtonClicked;
    $("a.readinglist").onclick = OnReadingListButtonClicked;
    ww.isAuthentificated().then(c => {
      if (c) {
        ShowConnectedView();
      } else {
        ShowDisconnectedView();
      }
    }, error);
    window.onload = null;
  });
}

/* Some action */

function ShowConnectedView() {
  $("body").setAttribute("view", "connected");
  ww.getUser().then(json => {
    $(".avatar").src = json.avatar_url;
  }, error);
}

function ShowDisconnectedView() {
  $("body").setAttribute("view", "disconnected");
}

function OnConnectButtonClicked() {
  ww.getAuthorizationURL().then(url => {
    function onMessageFromDialog(e) {
      var data = e.data;
      ww.onUserAuthorized(data).then(() => {
        ShowConnectedView();
      }, () => {
        error("Connection failed");
        window.location.reload();
      });
    }
    window.addEventListener("message", onMessageFromDialog, true);
    window.open(url, "readability", "dialog");
  }, e => {
    error(e);
    window.location.reload();
  });
}

function OnReadingListButtonClicked() {
  // window.open("readinglist.html", "readability", "mozhaidasheet");
  window.location = "readinglist.html";
}
