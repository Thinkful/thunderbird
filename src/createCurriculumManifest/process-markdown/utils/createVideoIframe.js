const getIframe = require('./getIframe');

module.exports = (src, $) => {
  const newElement = $.parseHTML(
    '<div class="video-container"><div class="video-content"></div></div>'
  );

  const iframeHtml = getIframe(src, 480, 853);

  $(newElement)
    .children('.video-content')
    .html(iframeHtml);

  return newElement;
};
