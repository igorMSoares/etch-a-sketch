import {
  calculateSquareSize,
  validateAndSetSquareSize,
  setSquareSize,
  renderGrid,
} from './render-grid.js';
import { renderColorPicker, resetColorPicker } from './color-picker.js';
import loadCSS from './load-css.js';

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

const loadCanvasCSS = (
  path = `${window.location.href}public/css/canvas.css`
) => {
  const CANVAS_CSS_LINK_ID = 'canvas-css--loaded';

  const isLoaded = document.getElementById(CANVAS_CSS_LINK_ID) ? true : false;

  if (!isLoaded) {
    loadCSS(path, CANVAS_CSS_LINK_ID);
  }
};

const renderCanvas = squaresPerRow => {
  loadCanvasCSS();
  canvas.innerHTML = '';
  document.querySelector('#color-picker p:only-child')
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

const initResetCanvasHandlers = () => {
  const resetCanvas = async () => {
    const { resetCanvas } = await import('./reset-canvas.js');
    resetCanvas();
  };
  document.getElementById('reset-canvas-btn').onclick = resetCanvas;
  document.getElementById('number-of-columns').onchange = resetCanvas;
  document.getElementById('number-of-columns').onkeyup = e => {
    if (e.key === 'Enter') resetCanvas();
  };
};

/** resizeTimer will be used to prevent the resize event to be triggered
 * multiple times while window is being resized.
 */
var resizeTimer = false;
const resizeCanvas = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    const squaresPerRow = parseInt(
      root.style.getPropertyValue('--squares-per-row')
    );

    const size = calculateSquareSize(squaresPerRow);
    setSquareSize(size, squaresPerRow);
  }, 300);
};

export { renderCanvas, setGridState, resizeCanvas, initResetCanvasHandlers };
