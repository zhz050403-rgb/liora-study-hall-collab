(function(){
  var res = performance.getEntriesByType('resource') || [];
  var bad = [];
  res.forEach(function(x){
    var s = x.responseStatus;
    if (s === 0 || (typeof s === 'number' && s >= 400)) {
      bad.push({file: x.name.split('/').slice(-2).join('/'), status: s, type: x.initiatorType});
    }
  });
  var txt = document.body ? document.body.innerText : '';
  var scripts = [];
  for (var i = 0; i < document.scripts.length; i++) {
    var src = document.scripts[i].getAttribute('src');
    if (src) scripts.push(src);
  }
  var heads = [];
  var hs = document.querySelectorAll('h1,h2,h3');
  for (var j = 0; j < hs.length && j < 14; j++) {
    heads.push(hs[j].innerText.replace(/\s+/g, ' ').trim().slice(0, 60));
  }
  return JSON.stringify({
    href: location.href,
    title: document.title,
    ready: document.readyState,
    textLen: txt.length,
    headText: txt.slice(0, 300).replace(/\n+/g, ' | '),
    portalLoaded: !!window.PORTAL_DATA,
    courseCount: (window.PORTAL_DATA && window.PORTAL_DATA.courses) ? window.PORTAL_DATA.courses.length : -1,
    resourceCount: res.length,
    failedResources: bad.slice(0, 12),
    scriptFiles: scripts.slice(0, 25),
    headings: heads,
    noteBlocks: document.querySelectorAll('.note-block, .note-card, .week-note').length
  }, null, 1);
})()
