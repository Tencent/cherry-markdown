var cherry = new Cherry({
  id: 'markdown',
  engine: {
    global: {
      htmlWhiteList: 'iframe|script|style',
    },
  },
  value: getExampleValue(),
});

function getExampleValue() {
  var objectNode = document.querySelector('object[name="demo-val"]');
  if (!objectNode) {
    return '';
  }
  return objectNode.contentDocument.documentElement.textContent;
}
