(function() {
  try {
    window.readability = JSON.parse(localStorage.readability);
  } catch(e) {
    console.log("Not logged in. Redirecting...");
    document.location = "connect.html";
    return;
  }

  console.log("We are logged in.", window.readability);

  window.addEventListener("load", function() {
    buildBookmarksList(false);
  });
})()

function buildBookmarksList(forceRefresh) {
  if (forceRefresh || !("bookmarks" in window.readability)) {
    rReq("get", "bookmarks", function(json) {
      window.readability.bookmarks = json.bookmarks;
      sync();
      buildBookmarksList(false);
    }, function(status, error) {
      if (status == 401) {
        localStorage.removeItem("readability");
        window.location.reload();
        return;
      }
      alert(error);
    }); 
  } else {
    var documentFragment = document.createDocumentFragment()
    for (var b of window.readability.bookmarks) {
      var li = buildBookmark(b);
      documentFragment.appendChild(li);
    }
    var ul = document.querySelector("#bookmarklist");
    ul.innerHTML = "";
    ul.appendChild(documentFragment);
  }
}

function sync() {
  localStorage.readability = JSON.stringify(window.readability);
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
  
  return li;
}
