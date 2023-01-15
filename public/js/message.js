import jsCssAnimations from './js-css-animations/js-css-animations.js';

const displayMessage = (message, duration = 1500) => {
  const msg = document.querySelector('.msg-area__text');
  document.getElementById('number-of-columns').disabled = true;
  document.getElementById('reset-canvas-btn').disabled = true;
  msg.innerText = message;

  jsCssAnimations.show.slideDown(msg, {
    overflowHidden: false,
    complete: () => {
      setTimeout(() => {
        jsCssAnimations.hide.slideUp(msg, {
          overflowHidden: false,
          complete: () => {
            msg.innerHTML = '';
            document.getElementById('number-of-columns').disabled = false;
            document.getElementById('reset-canvas-btn').disabled = false;
          },
        });
      }, duration);
    },
  });
};

export default displayMessage;
