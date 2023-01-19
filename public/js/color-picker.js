import jsCssAnimations from './js-css-animations/js-css-animations.js';
import initKeydownEvent from './init-keydown.js';

const resetColorPicker = () => {
  document
    .getElementById('color-picker')
    .setAttribute('current-color', 'black');
  const pickedColor = document.querySelector('.picked-color');
  if (pickedColor) pickedColor.classList.remove('picked-color');

  document.querySelector('.color[color="black"]').classList.add('picked-color');
};

const toggleColorPicker = () => {
  const colorPicker = document.getElementById('color-picker');
  const checkBoxes = document.querySelectorAll('#mode-selection input');

  jsCssAnimations.toggle(colorPicker, 'collapse', 'collapse', {
    duration: 350,
    timingFunction: 'ease-in-out',
    keepSpace: true,
    transfOrigin: 'center',
    start: () => {
      checkBoxes.forEach(inpt => (inpt.disabled = true));
    },
    complete: () => {
      checkBoxes.forEach(inpt => (inpt.disabled = false));
    },
  });
};

const hideColorPicker = () => {
  if (jsCssAnimations.isVisible(document.getElementById('color-picker'))) {
    toggleColorPicker();
  }
};

const showColorPicker = () => {
  if (jsCssAnimations.isHidden(document.getElementById('color-picker'))) {
    toggleColorPicker();
  }
};

const renderColorPicker = () => {
  const colorPicker = document.getElementById('color-picker');
  colorPicker.innerHTML = '';
  showColorPicker();
  let span;
  let hValue;
  let lValue = 46;
  const colorName = [
    'Red',
    'Orange',
    'Yellow',
    'Lime Green',
    'Green',
    'Emerald Green',
    'Turquoise',
    'Blue',
    'Navy Blue',
    'Purple',
    'Lilac',
    'Pink',
    'Black',
  ];

  for (let i = 0; i < 13; i++) {
    span = document.createElement('span');
    span.classList.add('color');
    span.setAttribute('tabindex', '0');
    span.setAttribute('role', 'button');
    span.setAttribute('aria-label', colorName[i]);

    hValue = 30 * i;
    if (i === 12) {
      span.style.setProperty('--s-value', '0%');
      hValue = 0;
      lValue = 0;
    }
    span.setAttribute('color', `${i === 12 ? 'black' : hValue}`);
    span.style.setProperty('--h-value', `${hValue}`);
    span.style.setProperty('--l-value', `${lValue}%`);

    colorPicker.appendChild(span);
  }

  resetColorPicker();
};

const changeColor = event => {
  const colorsStylesheet = document.createElement('style');
  document.getElementsByTagName('head')[0].appendChild(colorsStylesheet);

  const pickedColor = event.target.getAttribute('color');
  const hValue = event.target.style.getPropertyValue('--h-value');
  const lValue = event.target.style.getPropertyValue('--l-value');

  document.querySelector('.picked-color').classList.remove('picked-color');
  event.target.classList.add('picked-color');

  /** The current-color attrb is used to dynamically set pen color */
  document
    .getElementById('color-picker')
    .setAttribute('current-color', pickedColor);

  if (!colorsStylesheet.innerText.match(`bg-${pickedColor}`)) {
    colorsStylesheet.append(
      `.bg-${pickedColor} { background-color: hsl(${hValue}, 66%, ${lValue}) }`
    );
  }
};

const initChangeColorHandler = () => {
  document.querySelectorAll('.color').forEach(color => {
    color.onclick = changeColor;
    initKeydownEvent(color);
  });
};

export {
  renderColorPicker,
  initChangeColorHandler,
  showColorPicker,
  hideColorPicker,
  resetColorPicker,
};
