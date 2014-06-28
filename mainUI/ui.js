var readability;


window.addEventListener("load", function() {
  function connect() {
    console.log("Not logged in. Redirecting...");
    document.location = "/connect/connect.html";
  }
  localforage.setDriver("IndexedDB").then(function() {
    localforage.getItem("readability").then(function(value) {
      if (!value) {
        return connect();
      }
      readability = value;
      console.log("We are logged in.", readability);
      buildBookmarksList(false);
    }, connect);
  });
});

function buildBookmarksList(forceRefresh) {
  if (forceRefresh || !("bookmarks" in readability)) {
    gNetwork.rReq("get", "bookmarks").then(function(json) {
      var reqCount = json.bookmarks.length;
      for (var b of json.bookmarks) {
        (function(b) {
          var article = b.article;
          gNetwork.rReq("get", "articles/" + article.id).then(function(json2) {
            article.content = json2.content;
            reqCount--;
            if (reqCount == 0) {
              readability.bookmarks = json.bookmarks;
              // See https://github.com/mozilla/localForage/issues/151
              localforage.setItem("readability", readability, function() {
                buildBookmarksList(false);
              });
            }
          });
        })(b);
      }
    }, function(status, error) {
      if (status == 401) {
        localforage.clear(function() {
          window.location.reload();
        });
        return;
      }
      alert(error);
    });
  } else {
    var documentFragment = document.createDocumentFragment()
    for (var b of readability.bookmarks) {
      var li = buildBookmark(b);
      documentFragment.appendChild(li);
    }
    var ul = document.querySelector("#bookmarklist");
    ul.innerHTML = "";
    ul.appendChild(documentFragment);
  }
}

function buildBookmark(b) {
  var domain = document.createElement("p");
  domain.className = "domain";
  domain.textContent = decodeEntities(b.article.domain);

  var title = document.createElement("p");
  title.className = "title";
  title.textContent = decodeEntities(b.article.title);

  var excerpt = document.createElement("p");
  excerpt.className = "excerpt";
  excerpt.textContent = decodeEntities(b.article.excerpt);

  var li = document.createElement("li");
  li.appendChild(domain);
  li.appendChild(title);
  li.appendChild(excerpt);

  li.onclick = function() {
    window.open("/article/article.html#" + b.article.id, b.article.title, "mozhaidasheet");
  }

  return li;
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
