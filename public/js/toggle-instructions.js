import initKeydownEvent from './init-keydown.js';
import jsCssAnimations from './js-css-animations/js-css-animations.js';
import loadCSS from './load-css.js';

const loadJsCssAnimationsCss = (
  path = `${window.location.href}/public/js/js-css-animations/js-animations.css`
) => {
  const CSS_LINK_ID = 'jscssanimations-css--loaded';

  const isLoaded = document.getElementById(CSS_LINK_ID) ? true : false;

  if (!isLoaded) {
    loadCSS(path, CSS_LINK_ID);
  }
};

const initToggleInstructionsHandler = async () => {
  loadJsCssAnimationsCss();
  const toggler = document.querySelector('.toggle-instructions');
  toggler.style.removeProperty('display');
  initKeydownEvent(toggler);

  jsCssAnimations.init.fade({
    trigger: '.toggle-instructions',
    duration: 500,
    staggerDelay: 150,
    start: () => {
      jsCssAnimations.toggle(toggler, 'rotateDown', 'rotateUp');
    },
    complete: () => {
      document
        .getElementById('instructions')
        .classList.toggle('instructions-area__collapsed');
    },
  });
};

export default initToggleInstructionsHandler;
