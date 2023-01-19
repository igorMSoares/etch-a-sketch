const isSpacebarKey = event => [' ', 'spacebar'].includes(event.key);

const initKeydownEvent = (element, handler = false) => {
  element.addEventListener('keydown', event => {
    if (isSpacebarKey(event)) {
      event.preventDefault();
      if (handler) handler(event);
      else event.target.dispatchEvent(new Event('click'));
    }
  });
};

export default initKeydownEvent;
