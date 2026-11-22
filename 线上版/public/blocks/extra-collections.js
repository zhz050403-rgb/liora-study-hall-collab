/* Keep the investment series together after filtering or route changes. */
(function () {
  function groupCollections() {
    document.querySelectorAll('.academy-modules .module-grid').forEach(function (grid) {
      const cards = Array.from(grid.children).filter(function (card) {
        return card.matches('a.module-card') &&
          /^投资基础\s*[1-5]\s*[·．.]/.test(card.querySelector('h4')?.textContent.trim() || '');
      });
      if (!cards.length) return;
      const collection = document.createElement('details');
      collection.className = 'extra-collection';
      const summary = document.createElement('summary');
      const image = document.createElement('img');
      image.src = 'cabin-art/extra-stock.webp';
      image.alt = '';
      const title = document.createElement('strong');
      title.textContent = '投资基础合集';
      const count = document.createElement('span');
      count.textContent = cards.length + ' 篇';
      summary.append(image, title, count);
      const contents = document.createElement('div');
      contents.className = 'module-grid extra-collection-items';
      collection.append(summary, contents);
      grid.insertBefore(collection, cards[0]);
      cards.forEach(function (card) { contents.appendChild(card); });
    });
  }
  const app = document.getElementById('app');
  if (!app) return;
  new MutationObserver(groupCollections).observe(app, {childList: true});
  groupCollections();
})();
