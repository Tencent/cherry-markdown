var objectNode = /** @type {HTMLObjectElement} */ (document.querySelector('object[name="demo-val"]'));

var onloadeddata = function() {
  var value = objectNode ? objectNode.contentDocument.documentElement.textContent : '';
  window.cherry = new Cherry({
    id: 'markdown',
    engine: {
      global: {
        htmlWhiteList: 'iframe|script|style',
      },
    },
    value: value,
  });
};

if (!window.markdownLoaded && objectNode) {
  objectNode.onload = onloadeddata;
} else {
  onloadeddata();
}