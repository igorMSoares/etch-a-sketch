const canvas = document.getElementById('canvas');
const root = document.querySelector(':root');

const isMobile = () => {
  return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
    navigator.userAgent
  );
};

const toggleVisibility = elementId => {
  const element = document.getElementById(elementId);

  if (element.style.visibility === 'hidden') {
    element.style.visibility = '';
  } else {
    element.style.visibility = 'hidden';
  }
};

const displayMessage = (message, type) => {
  const msg = document.createElement('p');
  msg.innerText = message;
  msg.classList.add(type);
  document.getElementById('msg-area').appendChild(msg);
  toggleVisibility('msg-area');

  window.setTimeout(() => {
    toggleVisibility('msg-area');
    document.getElementById('msg-area').innerHTML = '';
  }, 2000);
};

const resetClasses = element => {
  const corner = [...element.classList].find(c =>
    c.match(/top|bottom|right|left/)
  );

  element.setAttribute('class', 'pixel');
  if (corner) element.classList.add(corner);
};

const cancelEvent = event => (event.target.onpointerenter = '');

const setColorBg = event => {
  resetClasses(event.target);
  event.target.classList.add(
    `bg-${document
      .getElementById('color-picker')
      .getAttribute('current-color')}`
  );
};

const setRandomBg = event => {
  resetClasses(event.target);

  event.target.classList.add('random-bg');
  event.target.style.setProperty('--h-value', Math.round(Math.random() * 300));
};

const resetBg = event => resetClasses(event.target);

const setDarkeningBg = event => {
  resetClasses(event.target);

  event.target.classList.add('darkening-bg');

  const currentColor = document
    .getElementById('color-picker')
    .getAttribute('current-color');

  let hValue;
  let sValue = 96;
  const lValue =
    parseInt(event.target.style.getPropertyValue('--l-value')) || 100;

  if (currentColor === 'black') {
    hValue = 0;
    sValue = 0;
  } else {
    hValue = currentColor;
  }

  if (lValue !== 0) {
    let newValue = lValue >= 10 ? lValue - 10 : 0;
    event.target.style.setProperty('--h-value', `${hValue}`);
    event.target.style.setProperty('--s-value', `${sValue}%`);
    event.target.style.setProperty('--l-value', `${newValue}%`);
    if (newValue === 0) cancelEvent(event);
  }
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

const setSquaresSize = squaresPerRow => {
  const canvasWidth = canvas.clientWidth;

  let size = Math.round(canvasWidth / squaresPerRow) - 1;

  root.style.setProperty('--square-size', `${size}px`);
  root.style.setProperty('--squares-per-row', `${squaresPerRow}`);

  return size;
};

const resizeCanvas = () => {
  const squaresPerRow = parseInt(
    document.getElementById('number-of-columns').value
  );

  if (squaresPerRow) {
    setSquaresSize(squaresPerRow);
    canvas.style.setProperty('height', 'fit-content');
  }
};

const resetColorPicker = () => {
  document
    .getElementById('color-picker')
    .setAttribute('current-color', 'black');
  const pickedColor = document.querySelector('.picked-color');
  if (pickedColor) pickedColor.classList.remove('picked-color');

  document.querySelector('.color[color="black"]').classList.add('picked-color');
};

const renderColorPicker = () => {
  const colorPicker = document.getElementById('color-picker');
  let span;
  let hValue;
  let lValue = 46;

  for (let i = 0; i < 13; i++) {
    span = document.createElement('span');
    span.classList.add('color');

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

const addRoundCorner = (element, canvas) => {
  const corner = {
    0: 'top-left',
    [canvas.columns - 1]: 'top-right',
    [canvas.columns * canvas.rows - 1]: 'bottom-right',
    [canvas.columns * canvas.rows - canvas.columns]: 'bottom-left',
  };

  element.classList.add(`${corner[element.id]}`);
};

const renderCanvas = squaresPerRow => {
  canvas.innerHTML = '';
  document.getElementById('color-picker').innerHTML === ''
    ? renderColorPicker()
    : resetColorPicker();

  const size = setSquaresSize(squaresPerRow);
  const canvasHeight = canvas.clientHeight;
  let totalRows = Math.floor(canvasHeight / size);
  if (totalRows < 2) totalRows = 2;

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

    div.onpointerenter = setColorBg;

    if (isMobile()) {
      div.addEventListener('touchstart', touchScreenHandler);
    }
    canvas.appendChild(div);
  }

  document
    .getElementById('number-of-columns')
    .setAttribute('value', squaresPerRow);
};

const resetCanvas = () => {
  const inputField = document.getElementById('number-of-columns');
  const columns = parseInt(inputField.value);

  if (!columns) {
    inputField.setAttribute('placeholder', '');
    window.setTimeout(() => {
      inputField.setAttribute('placeholder', 'Number of Columns');
    }, 200);
  } else if (columns <= 1) {
    inputField.value = '';
    displayMessage('Type in a positive number greater than 1', 'error');
  } else if (columns > 100) {
    inputField.value = '';
    displayMessage('Choose a number less than or equal to 100', 'error');
  } else {
    document.querySelectorAll('input[type="checkbox"]').forEach(box => {
      box.checked = false;
      box.disabled = false;
      if (document.getElementById('color-picker').visibility === 'hidden') {
        toggleVisibility('color-picker');
      }
    });

    canvas.style.removeProperty('height');
    renderCanvas(columns);
  }
};

const initResetCanvasHandlers = () => {
  document.getElementById('reset-canvas-btn').onclick = resetCanvas;
  document.getElementById('number-of-columns').onchange = resetCanvas;
  document.getElementById('number-of-columns').onkeyup = e => {
    if (e.key === 'Enter') resetCanvas();
  };
};

const initColorModeHandler = mode => {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => (cb.checked = false));
  const handler = {
    'random-color-mode': setRandomBg,
    'progressive-darkening-mode': setDarkeningBg,
    'erase-mode': resetBg,
    default: setColorBg,
  };

  document.getElementById(mode).onchange = e => {
    let eventHandler;
    if (e.target.checked) {
      checkboxes.forEach(cb => {
        if (cb !== e.target) {
          cb.disabled = true;
        }
      });

      if (mode === 'random-color-mode') toggleVisibility('color-picker');

      eventHandler = handler[mode];
    } else {
      checkboxes.forEach(cb => (cb.disabled = false));

      if (mode === 'random-color-mode') toggleVisibility('color-picker');

      eventHandler = handler.default;
    }

    document.querySelectorAll('.pixel').forEach(square => {
      square.onpointerenter = eventHandler;
    });
  };
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
  document
    .querySelectorAll('.color')
    .forEach(color => (color.onclick = changeColor));
};

const start = squaresPerRow => {
  renderCanvas(squaresPerRow);
  initResetCanvasHandlers();
  initChangeColorHandler();
  ['erase-mode', 'random-color-mode', 'progressive-darkening-mode'].forEach(
    mode => initColorModeHandler(mode)
  );
  window.onresize = resizeCanvas;
};

start(30);
