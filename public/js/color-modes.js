import initKeydownEvent from './init-keydown.js';

const findCornerClass = element =>
  [...element.classList].find(c => c.match(/top|bottom|right|left/));

const resetPixelsClasses = element => {
  const corner = findCornerClass(element);

  element.setAttribute('class', 'pixel');
  if (corner) element.classList.add(corner);
};

const cancelEvent = event => (event.target.onpointerenter = '');

const setColorBg = event => {
  resetPixelsClasses(event.target);
  event.target.classList.add(
    `bg-${document
      .getElementById('color-picker')
      .getAttribute('current-color')}`
  );
};

const setRandomBg = event => {
  resetPixelsClasses(event.target);

  event.target.classList.add('random-bg');
  event.target.style.setProperty('--h-value', Math.round(Math.random() * 300));
};

const resetBg = event => resetPixelsClasses(event.target);

const setGradientBg = event => {
  resetPixelsClasses(event.target);

  let mode;
  if (document.getElementById('progressive-darkening-mode').checked) {
    mode = 'darkening-bg';
  } else if (document.getElementById('progressive-lighten-mode').checked) {
    mode = 'lighten-bg';
  }
  event.target.classList.add(mode);

  const currentColor = document
    .getElementById('color-picker')
    .getAttribute('current-color');

  const startValue = mode === 'darkening-bg' ? 100 : 0;
  const stopValue = mode === 'darkening-bg' ? 0 : 100;

  let hValue;
  let sValue = 96;
  const lValue =
    parseInt(event.target.style.getPropertyValue('--l-value')) || startValue;

  if (currentColor === 'black') {
    hValue = 0;
    sValue = 0;
  } else {
    hValue = currentColor;
  }

  if (lValue !== stopValue) {
    let newValue;
    if (mode === 'darkening-bg') {
      newValue = lValue >= 10 ? lValue - 10 : stopValue;
    } else if (mode === 'lighten-bg') {
      newValue = lValue < 90 ? lValue + 10 : stopValue;
    }

    event.target.style.setProperty('--h-value', `${hValue}`);
    event.target.style.setProperty('--s-value', `${sValue}%`);
    event.target.style.setProperty('--l-value', `${newValue}%`);
    if (newValue === stopValue) cancelEvent(event);
  }
};

/** Handle changing selectors via keyboard (by pressing spacebar)
 * when navigating using tab key */
const initColorModeKeydownHandler = () => {
  document.querySelectorAll('.color-mode-picker').forEach(cb =>
    initKeydownEvent(cb, e => {
      const modeSelector = e.target.previousElementSibling;
      modeSelector.checked = !modeSelector.checked;
      modeSelector.dispatchEvent(new Event('change'));
    })
  );
};

const getState = elementId =>
  document.getElementById(elementId).getAttribute('state');

const toggleState = (elementId, setStateHandler) => {
  const toggle = {
    visible: 'hidden',
    hidden: 'visible',
  };

  setStateHandler(toggle[getState(elementId)]);
};

const initColorModeHandler = async mode => {
  initColorModeKeydownHandler();
  const modeSelector = document.querySelectorAll('.color-mode-selector');
  modeSelector.forEach(selector => (selector.checked = false));

  const { setRandomBg, setGradientBg, resetBg, setColorBg } = await import(
    './color-modes.js'
  );
  const handler = {
    'random-color-mode': setRandomBg,
    'progressive-darkening-mode': setGradientBg,
    'progressive-lighten-mode': setGradientBg,
    'erase-mode': resetBg,
    default: setColorBg,
  };

  document.getElementById(mode).onchange = async e => {
    e.target.nextElementSibling.ariaChecked = e.target.checked;
    if (e.target.id === 'toggle-grid') {
      const { setGridState } = await import('./render-canvas.js');
      toggleState('grid-state', setGridState);
    } else {
      const { hideColorPicker, showColorPicker } = await import(
        './color-picker.js'
      );
      let eventHandler;
      if (e.target.checked) {
        modeSelector.forEach(cb => {
          if (cb !== e.target && cb.id !== 'toggle-grid') {
            cb.nextElementSibling.classList.add('disabled-cbox');
            if (cb.id === 'erase-mode' && cb.checked) Brush.mode = 'brush';
            cb.checked = false;
            cb.nextElementSibling.ariaChecked = cb.checked;
          }
        });

        mode === 'random-color-mode' || mode === 'erase-mode'
          ? hideColorPicker()
          : showColorPicker();

        if (mode === 'erase-mode') Brush.mode = 'eraser';

        eventHandler = handler[mode];
      } else {
        modeSelector.forEach(cb => {
          if (cb.id !== 'toggle-grid') {
            cb.nextElementSibling.classList.remove('disabled-cbox');
          }
        });

        if (mode === 'random-color-mode' || mode === 'erase-mode')
          showColorPicker();
        if (mode === 'erase-mode') Brush.mode = 'brush';

        eventHandler = handler.default;
      }

      const { Brush } = await import('./brush.js');
      document.querySelectorAll('.pixel').forEach(square => {
        square.onpointerenter = e => {
          if (Brush.isOn) eventHandler(e);
        };
      });
    }
  };
};

export {
  initColorModeHandler,
  setColorBg,
  setRandomBg,
  setGradientBg,
  resetBg,
  findCornerClass,
};
