import displayMessage from './message.js';
import isMobile from './is-mobile.js';
import { Brush } from './brush.js';
import { setColorBg } from './color-modes.js';

const root = document.querySelector(':root');

const calculateSquareSize = squaresPerRow => {
  let size =
    Math.round(document.querySelector('main').clientWidth / squaresPerRow) - 1;

  return size;
};

const setSquareSize = (size, totalColumns) => {
  root.style.setProperty('--square-size', `${size}px`);
  root.style.setProperty('--squares-per-row', `${totalColumns}`);
};

const validateAndSetSquareSize = (size, squaresPerRow) => {
  const inputField = document.getElementById('number-of-columns');
  const maxWidth = document.querySelector('main').clientWidth;
  let totalColumns;
  if (size * squaresPerRow > Math.round(maxWidth)) {
    totalColumns = Math.round(maxWidth / (size + 1));

    inputField.classList.add('red-bg');
    displayMessage(
      `${squaresPerRow} columns does not fit your screen :( using ${totalColumns} instead.`,
      1500
    );

    if (isMobile() && !/landscape/.test(screen.orientation.type)) {
      setTimeout(() => {
        displayMessage(
          'Try changing to landscape orientation to get more space for your canvas',
          1500
        );
      }, 4200);
    }
  } else totalColumns = squaresPerRow;
  setSquareSize(size, totalColumns);

  setTimeout(() => {
    inputField.classList.remove('red-bg');
  }, 2000);
  document.getElementById('number-of-columns').value = totalColumns;

  return totalColumns;
};

const addRoundCorner = (
  element,
  canvasDimensions,
  canvasElementId = 'canvas'
) => {
  const corner = {
    0: 'top-left',
    [canvasDimensions.columns - 1]: 'top-right',
    [canvasDimensions.columns * canvasDimensions.rows - 1]: 'bottom-right',
    [canvasDimensions.columns * canvasDimensions.rows -
    canvasDimensions.columns]: 'bottom-left',
  };
  const canvasElement = document.getElementById(canvasElementId);

  if (!canvasElement.hasAttribute('corners')) {
    canvasElement.setAttribute('corners', Object.keys(corner));
  }

  element.classList.add(`${corner[element.id]}`);
};

const touchScreenHandler = event => {
  let startPixel = document.elementFromPoint(
    event.touches[0].clientX,
    event.touches[0].clientY
  );

  event.target.ontouchmove = event => {
    event.preventDefault();
    let currentPixel = document.elementFromPoint(
      event.touches[0].clientX,
      event.touches[0].clientY
    );

    if (startPixel != currentPixel) {
      currentPixel.dispatchEvent(new Event('pointerenter'));
      startPixel = currentPixel;
    }
  };
};

const renderGrid = async (
  squaresPerRow,
  totalRows,
  canvasElementId = 'canvas'
) => {
  const docFragment = document.createDocumentFragment();

  let div;
  for (let i = 0; i < squaresPerRow * totalRows; i++) {
    div = document.createElement('div');
    div.setAttribute('id', i);
    div.classList.add('pixel');

    if (
      i === 0 ||
      i === squaresPerRow - 1 ||
      i === squaresPerRow * totalRows - 1 ||
      i === squaresPerRow * totalRows - squaresPerRow
    ) {
      addRoundCorner(div, { columns: squaresPerRow, rows: totalRows });
    }

    div.onpointerenter = e => {
      if (Brush.isOn) setColorBg(e);
    };

    if (isMobile()) {
      div.addEventListener('touchstart', touchScreenHandler);
    }
    docFragment.appendChild(div);
  }

  document.getElementById(canvasElementId).appendChild(docFragment);
};

export {
  calculateSquareSize,
  setSquareSize,
  validateAndSetSquareSize,
  renderGrid,
};
