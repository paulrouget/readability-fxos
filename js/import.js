/* Worker */

var sw = new SharedWorker("/libs/readability.js");
sw.port.start();
var ww = WorkerWrapper(sw.port);

var error = e => alert("Error:" + e);

navigator.mozSetMessageHandler('activity', function(activityRequest) {
  var option = activityRequest.source;
  ww.init().then(() => {
    ww.isAuthentificated().then(c => {
      if (c) {
        ww.addBookmark(option.data.url).then(() => {
          activityRequest.postResult(true);
        }, e => {
          error(e);
          activityRequest.postError();
        });
      } else {
        activityRequest.postError("Not authentificated yet");
      }
    }, e => {
      error(e);
      activityRequest.postError();
    }, e => {
      error(e);
      activityRequest.postError();
    });
  });
});
