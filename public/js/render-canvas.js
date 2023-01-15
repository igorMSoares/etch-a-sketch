import brush from './brush.js';
import isMobile from './is-mobile.js';
import jsCssAnimations from './js-css-animations/js-css-animations.js';
import {
  calculateSquareSize,
  validateAndSetSquareSize,
  renderGrid,
} from './render-grid.js';

const SQUARES_PER_ROW = 30;
const root = document.querySelector(':root');
const canvas = document.getElementById('canvas');

const fitContent = element => {
  element.style.setProperty('width', 'fit-content');
  element.style.setProperty('height', 'fit-content');
};

const setState = (elementId, state, visible, hidden) => {
  const element = document.getElementById(elementId);
  element.setAttribute('state', state);

  if (state === 'visible') {
    visible(element);
  } else if (state === 'hidden') {
    hidden(element);
  }
};

const setGridState = state => {
  setState(
    'grid-state',
    state,
    () => root.style.setProperty('--square-border-w', '1px'),
    () => root.style.setProperty('--square-border-w', '0px')
  );
};

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

const renderCanvas = squaresPerRow => {
  canvas.innerHTML = '';
  document.getElementById('color-picker').innerHTML === ''
    ? renderColorPicker()
    : resetColorPicker();

  setGridState('visible');

  let size = calculateSquareSize(squaresPerRow);
  if (size < 10) size = 10;

  const totalColumns = validateAndSetSquareSize(size, squaresPerRow);
  let totalRows = Math.floor((0.95 * window.innerHeight) / size);
  if (totalRows < 2) totalRows = 2;
  else if (totalRows > 100) totalRows = totalColumns;

  renderGrid(totalColumns, totalRows);
  fitContent(canvas);

  document
    .getElementById('number-of-columns')
    .setAttribute('value', totalColumns);
};

// renderCanvas(SQUARES_PER_ROW);
// if (!isMobile()) {
//   canvas.addEventListener('click', () => {
//     brush.state = brush.isOn ? 'off' : 'on';
//   });
// }

export { renderCanvas, setGridState, hideColorPicker, showColorPicker };
