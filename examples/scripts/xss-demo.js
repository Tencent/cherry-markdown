fetch('./markdown/xss.md').then((response) => response.text()).then((value) => {
  var config = Object.assign({}, cherryConfig, { value: value });
  window.cherry = new Cherry({
    id: 'markdown',
    engine: {
      global: {
        htmlWhiteList: 'iframe|script|style',
      },
    },
    value: value,
  });
});
