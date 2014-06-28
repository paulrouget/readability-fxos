var readability;

window.addEventListener("load", function() {
  var id = document.location.hash.substr(1);
  localforage.getItem("readability").then(function(value) {
    readability = value;
    for (var b of readability.bookmarks) {
      if (b.article.id == id) {
        document.querySelector("h1").textContent = b.article.title;
        document.querySelector("main").innerHTML = b.article.content;
        return;
      }
    }
    console.error("ID not found:" + id);
  });
});
