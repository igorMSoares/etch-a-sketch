import jsCssAnimations from './js-css-animations/js-css-animations.js';

const canvas = document.getElementById('canvas');
const root = document.querySelector(':root');
const brush = {
  isOn: false,
  type: 'brush',
  set state(state) {
    if (state === 'on') {
      this.isOn = true;
      canvas.classList.add(this.type);
      canvas.classList.remove(this.toggle[this.type]);
      canvas.removeAttribute('title');
    } else if (state === 'off') {
      this.isOn = false;
      canvas.classList.remove(this.type);
      this.setCanvasTitleAttr();
    }
  },
  set mode(mode) {
    this.type = mode;
    canvas.classList.remove(this.toggle[this.type]);
    if (this.isOn) canvas.classList.add(this.type);
    this.setCanvasTitleAttr();
  },
  toggle: {
    brush: 'eraser',
    eraser: 'brush',
  },
  setCanvasTitleAttr() {
    const action = this.type === 'brush' ? 'coloring' : 'erasing';
    canvas.setAttribute('title', `Click to start ${action}`);
  },
};

const isMobile = () => {
  return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
    navigator.userAgent
  );
};

const hideColorPicker = () => {
  const colorPicker = document.getElementById('color-picker');
  const checkBoxes = document.querySelectorAll('#mode-selection input');
  if (getComputedStyle(colorPicker).opacity === '1') {
    jsCssAnimations.hide.slideUp(colorPicker, {
      duration: 350,
      timingFunction: 'ease-in-out',
      heightTransition: false,
      widthTransition: false,
      hide: true,
      start: () => {
        checkBoxes.forEach(inpt => (inpt.disabled = true));
      },
      complete: () => {
        checkBoxes.forEach(inpt => (inpt.disabled = false));
      },
    });
  }
};

const showColorPicker = () => {
  const colorPicker = document.getElementById('color-picker');
  const checkBoxes = document.querySelectorAll('#mode-selection input');
  if (getComputedStyle(colorPicker).opacity === '0') {
    jsCssAnimations.show.slideUp(colorPicker, {
      duration: 300,
      timingFunction: 'ease-in-out',
      heightTransition: false,
      widthTransition: false,
      hide: true,
      start: () => {
        checkBoxes.forEach(inpt => (inpt.disabled = true));
      },
      complete: () => {
        checkBoxes.forEach(inpt => (inpt.disabled = false));
      },
    });
  }
};

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
  showColorPicker();
  let span;
  let hValue;
  let lValue = 46;

  for (let i = 0; i < 13; i++) {
    span = document.createElement('span');
    span.classList.add('color');
    span.setAttribute('tabindex', '0');

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

const getState = elementId =>
  document.getElementById(elementId).getAttribute('state');

const setState = (elementId, state, visible, hidden) => {
  const element = document.getElementById(elementId);
  element.setAttribute('state', state);

  if (state === 'visible') {
    visible(element);
  } else if (state === 'hidden') {
    hidden(element);
  }
};

const toggleState = (elementId, setStateHandler) => {
  const toggle = {
    visible: 'hidden',
    hidden: 'visible',
  };

  setStateHandler(toggle[getState(elementId)]);
};

const setGridState = state => {
  setState(
    'grid-state',
    state,
    () => root.style.setProperty('--square-border-w', '1px'),
    () => root.style.setProperty('--square-border-w', '0px')
  );
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

const calculateSquareSize = squaresPerRow => {
  let size =
    Math.round(document.querySelector('main').clientWidth / squaresPerRow) - 1;

  return size;
};

const fitContent = element => {
  element.style.setProperty('width', 'fit-content');
  element.style.setProperty('height', 'fit-content');
};

/** resizeTimer will be used to prevent the resize event to be triggered
 * multiple times while window is being resized.
 */
var resizeTimer = false;
const resizeCanvas = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const squaresPerRow = parseInt(
      root.style.getPropertyValue('--squares-per-row')
    );

    const size = calculateSquareSize(squaresPerRow);
    setSquareSize(size, squaresPerRow);
  }, 300);
};

const addRoundCorner = (element, canvas) => {
  const corner = {
    0: 'top-left',
    [canvas.columns - 1]: 'top-right',
    [canvas.columns * canvas.rows - 1]: 'bottom-right',
    [canvas.columns * canvas.rows - canvas.columns]: 'bottom-left',
  };

  document
    .getElementById('canvas')
    .setAttribute('corners', Object.keys(corner));

  element.classList.add(`${corner[element.id]}`);
};

const renderGrid = (squaresPerRow, totalRows, elementId = 'canvas') => {
  const canvasElement = document.getElementById(elementId);

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
      if (brush.isOn) setColorBg(e);
    };

    if (isMobile()) {
      div.addEventListener('touchstart', touchScreenHandler);
    }
    canvasElement.appendChild(div);
  }
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

const resetCanvas = () => {
  const inputField = document.getElementById('number-of-columns');
  const columns = parseInt(inputField.value);

  if (!columns) {
    inputField.setAttribute('placeholder', '');
    inputField.classList.add('red-bg');

    setTimeout(() => {
      inputField.classList.remove('red-bg');
      inputField.setAttribute('placeholder', '...');
    }, 200);
  } else if (columns <= 1) {
    inputField.value = '';
    displayMessage('Type in a positive number greater than 1');
  } else if (columns > 100) {
    inputField.value = '';
    displayMessage('Choose a number less than or equal to 100');
  } else {
    document.querySelectorAll('.color-mode-selector').forEach(box => {
      box.checked = false;
      box.disabled = false;
      showColorPicker();
    });

    canvas.style.removeProperty('height');
    canvas.style.removeProperty('width');
    renderCanvas(columns);
    brush.mode = 'brush';
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
  initColorModeKeydownHandler();
  const modeSelector = document.querySelectorAll('.color-mode-selector');
  modeSelector.forEach(selector => (selector.checked = false));

  const handler = {
    'random-color-mode': setRandomBg,
    'progressive-darkening-mode': setGradientBg,
    'progressive-lighten-mode': setGradientBg,
    'erase-mode': resetBg,
    default: setColorBg,
  };

  document.getElementById(mode).onchange = e => {
    if (e.target.id === 'toggle-grid') {
      toggleState('grid-state', setGridState);
    } else {
      let eventHandler;
      if (e.target.checked) {
        modeSelector.forEach(cb => {
          if (cb !== e.target && cb.id !== 'toggle-grid') {
            cb.nextElementSibling.classList.add('disabled-cbox');
            if (cb.id === 'erase-mode' && cb.checked) brush.mode = 'brush';
            cb.checked = false;
          }
        });

        mode === 'random-color-mode' || mode === 'erase-mode'
          ? hideColorPicker()
          : showColorPicker();

        if (mode === 'erase-mode') brush.mode = 'eraser';

        eventHandler = handler[mode];
      } else {
        modeSelector.forEach(cb => {
          if (cb.id !== 'toggle-grid') {
            cb.nextElementSibling.classList.remove('disabled-cbox');
          }
        });

        if (mode === 'random-color-mode' || mode === 'erase-mode')
          showColorPicker();
        if (mode === 'erase-mode') brush.mode = 'brush';

        eventHandler = handler.default;
      }

      document.querySelectorAll('.pixel').forEach(square => {
        square.onpointerenter = e => {
          if (brush.isOn) eventHandler(e);
        };
      });
    }
  };
};

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

const initChangeColorHandler = () => {
  document.querySelectorAll('.color').forEach(color => {
    color.onclick = changeColor;
    initKeydownEvent(color);
  });
};

const removeOutlineOnClick = element => {
  element.addEventListener('click', e => {
    e.target.style.setProperty('outline-style', 'none');
  });
  element.addEventListener('focusout', e => {
    e.target.style.removeProperty('outline-style');
  });
};

const initToggleInstructionsHandler = () => {
  const toggler = document.querySelector('.toggle-instructions');
  removeOutlineOnClick(toggler);
  initKeydownEvent(toggler);

  jsCssAnimations.init.fade({
    toggleBtn: '.toggle-instructions',
    duration: 500,
    staggerDelay: 150,
    fillMode: 'backwards',
    start: () => {
      const rotateClass = [...toggler.classList].find(c => c.match(/rotate/));
      if (!rotateClass || rotateClass.match('rotate-up')) {
        jsCssAnimations.rotateDown(toggler, {
          resetAfter: false,
        });
      } else {
        jsCssAnimations.rotateUp(toggler, { resetAfter: false });
      }
    },
    complete: () => {
      document
        .getElementById('instructions')
        .classList.toggle('instructions-area__collapsed');
    },
  });
};

const initDownloadHandler = () => {
  const getCanvasRatio = (sideA, sideB) =>
    parseFloat((Math.max(sideA, sideB) / Math.min(sideA, sideB)).toFixed(1));

  const canvasSize = () => {
    const e = document.getElementById('canvas');
    const width = e.clientWidth;
    const height = e.clientHeight;
    const greater = Math.max(height, width);
    const greaterSide = greater === width ? 'width' : 'height';
    return {
      width,
      height,
      greaterSide,
    };
  };

  const boxContent = document.querySelector('#download p').innerText;
  document.getElementById('download-icon').addEventListener('click', e => {
    jsCssAnimations.hide.fade(e.target, { duration: 250 });
    document
      .querySelector('#download p')
      .style.setProperty('line-height', 'normal');
    const waitMsg = 'Preparing image for download... Please wait';
    document.querySelector('#download p').innerText = waitMsg;
    root.style.setProperty('cursor', 'wait');

    const maxSize = 850;
    const size = canvasSize();
    const ratio = getCanvasRatio(size.width, size.height);
    const w =
      size.greaterSide === 'width' ? maxSize : parseInt(maxSize / ratio);

    html2canvas(canvas, {
      logging: false,
      scale: ratio,
      onclone: doc => {
        const r = doc.querySelector(':root');

        /** Resize squares so the final image doesn't get neither too small,
         * on smaller screens, nor too large, on larger screens */
        const squaresPerRow = parseInt(
          r.style.getPropertyValue('--squares-per-row')
        );
        let squareSize = Math.round((1.05 * w) / squaresPerRow) - 1;
        squareSize = squareSize < 10 ? 10 : squareSize;
        r.style.setProperty('--square-size', `${squareSize}px`);

        /** Fix square size when the grid is hidden.
         * The generated image was still displaying a faint border,
         * only beetween the colored squares, as it was not properly
         * compensating the --square-border-w set to zero */
        if (r.style.getPropertyValue('--square-border-w') === '0px') {
          const squareSize = parseInt(
            r.style.getPropertyValue('--square-size').match(/^(\d+)px$/)[1]
          );
          r.style.setProperty('--square-size', `${squareSize + 1}px`);
        }

        /** Removes round corners on generated image. */
        const corners = doc
          .getElementById('canvas')
          .getAttribute('corners')
          .split(',');
        for (let id of corners) {
          const element = doc.getElementById(id);
          element.classList.remove(findCornerClass(element));
        }
      },
    }).then(canvas => {
      const anchor = document.getElementById('download-link');
      anchor.setAttribute('href', canvas.toDataURL('image/jpeg'));
      anchor.setAttribute('download', 'sketch.jpg');
      anchor.click();

      root.style.removeProperty('cursor');
      document.querySelector('#download p').style.removeProperty('line-height');
      setTimeout(() => {
        jsCssAnimations.show.slideUp(document.getElementById('download-icon'), {
          action: 'show',
        });
      }, 400);
      document.querySelector('#download p').innerText = boxContent;
    });
  });

  initKeydownEvent(document.getElementById('download-icon'));
};

const start = squaresPerRow => {
  initToggleInstructionsHandler();
  initDownloadHandler();

  renderCanvas(squaresPerRow);
  initResetCanvasHandlers();
  initChangeColorHandler();
  [
    'erase-mode',
    'random-color-mode',
    'progressive-darkening-mode',
    'progressive-lighten-mode',
    'toggle-grid',
  ].forEach(mode => initColorModeHandler(mode));

  if (!isMobile()) {
    canvas.addEventListener('click', () => {
      brush.state = brush.isOn ? 'off' : 'on';
    });
    window.onresize = resizeCanvas;
  } else {
    brush.state = 'on';
    screen.orientation.addEventListener('change', resizeCanvas);
  }
};

start(30);
