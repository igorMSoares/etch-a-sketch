const preLoadCSS = href => {
  const linkTag = document.createElement('link');
  linkTag.rel = 'preload';
  linkTag.as = 'style';
  linkTag.href = href;
  document.getElementsByTagName('head')[0].appendChild(linkTag);
};

const loadCSS = (href, id) => {
  preLoadCSS(href);
  const linkTag = document.createElement('link');
  linkTag.id = id;
  linkTag.rel = 'stylesheet';
  linkTag.href = href;
  document.getElementsByTagName('head')[0].appendChild(linkTag);
};

export default loadCSS;
