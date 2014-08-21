/* Utils */

var error = e => alert("Error:" + e);
var $ = q => document.querySelector(q)

/* Worker */

var sw = new SharedWorker("/libs/readability.js");
sw.port.start();
var ww = WorkerWrapper(sw.port);

/* Init */

window.onload = function() {
  ww.init().then(() => {
    ww.getBookmarks().then(bookmarks => {
      var ul = $(".readinglist");
      for (var b of bookmarks) {
        ul.appendChild(BuildBookmark(b));
      }
    }, error);
  });
}

function BuildBookmark(b) {
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

  li.onclick = () => {
    alert(b.article.content);
  }

  return li;
}

function decodeEntities(str) {
  var element = document.createElement('div');
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
