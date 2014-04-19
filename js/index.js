(function() {
  try {
    window.readability = JSON.parse(localStorage.readability);
  } catch(e) {
    console.log("Not logged in. Redirecting...");
    document.location = "connect.html";
    return;
  }

  console.log("We are logged in.");

  window.addEventListener("load", function() {
    buildBookmarksList();
  });
})()

function buildBookmarksList() {
  rReq("get", "bookmarks", function(json) {
    var ul = document.querySelector("#bookmarklist");
    ul.innerHTML = "";
    for (var b of json.bookmarks) {
      var li = buildBookmark(b);
      ul.appendChild(li);
    }
  }, function(status, error) {
    if (status == 401) {
      localStorage.removeItem("readability");
      window.location.reload();
      return;
    }
    alert(error);
  });
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