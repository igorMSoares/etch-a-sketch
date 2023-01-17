import isMobile from './is-mobile.js';
import { Brush } from './brush.js';

const canvas = document.getElementById('canvas');
const root = document.querySelector(':root');

const loadScript = (src, id, opts = {}) =>
  new Promise(resolve => {
    const head = document.getElementsByTagName('head')[0];
    const newScript = document.createElement('script');
    newScript.id = id;
    newScript.src = src;
    if (opts.module) newScript.type = 'module';

    head.appendChild(newScript);
    newScript.addEventListener('load', _ => resolve(), { once: true });
  });

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

const toggleState = (elementId, setStateHandler) => {
  const toggle = {
    visible: 'hidden',
    hidden: 'visible',
  };

  setStateHandler(toggle[getState(elementId)]);
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

    const { calculateSquareSize, setSquareSize } = await import(
      './render-grid.js'
    );
    const size = calculateSquareSize(squaresPerRow);
    setSquareSize(size, squaresPerRow);
  }, 300);
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

      document.querySelectorAll('.pixel').forEach(square => {
        square.onpointerenter = e => {
          if (Brush.isOn) eventHandler(e);
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

const initToggleInstructionsHandler = async () => {
  const { default: jsCssAnimations } = await import(
    './js-css-animations/js-css-animations.js'
  );
  const toggler = document.querySelector('.toggle-instructions');
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

  const downloadCanvas = async (canvas, w, ratio) => {
    const HTML2C_SCRIPT_ID = 'html2canvas-script';
    const isLoaded = document.getElementById(HTML2C_SCRIPT_ID) ? true : false;

    if (!isLoaded) {
      await loadScript(
        `${window.location}public/js/html2canvas.min.js`,
        HTML2C_SCRIPT_ID
      );
    }

    html2canvas(canvas, {
      logging: false,
      scale: ratio,
      onclone: async doc => {
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
        const { findCornerClass } = await import('./color-modes.js');
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
      const anchor = document.createElement('a');
      anchor.style.setProperty('display', 'none');
      anchor.setAttribute('href', canvas.toDataURL('image/jpeg'));
      anchor.setAttribute('download', 'sketch.jpg');
      document.getElementById('download').appendChild(anchor);
      anchor.click();
      document.getElementById('download').removeChild(anchor);

      setTimeout(async () => {
        const { default: jsCssAnimations } = await import(
          './js-css-animations/js-css-animations.js'
        );
        jsCssAnimations.show.slideUp(document.getElementById('download-icon'), {
          keepSpace: true,
          start: () => {
            root.style.removeProperty('cursor');
            downloadBoxText.style.removeProperty('line-height');
            downloadBoxText.innerText = downloadBoxMsg;
          },
        });
      }, 400);
    });
  };

  const downloadBoxText = document.querySelector('#download p');
  const downloadBoxMsg = downloadBoxText.innerText;
  document
    .getElementById('download-icon')
    .addEventListener('click', async e => {
      const { default: jsCssAnimations } = await import(
        './js-css-animations/js-css-animations.js'
      );
      jsCssAnimations.hide.fade(e.target, {
        duration: 250,
        keepSpace: true,
        complete: () => {
          downloadBoxText.style.setProperty('line-height', 'normal');
          const waitMsg = 'Preparing image for download... Please wait';
          downloadBoxText.innerText = waitMsg;
          root.style.setProperty('cursor', 'wait');
        },
      });

      const maxSize = 850;
      const size = canvasSize();
      const canvasRatio = getCanvasRatio(size.width, size.height);
      const canvasWidth =
        size.greaterSide === 'width'
          ? maxSize
          : parseInt(maxSize / canvasRatio);

      downloadCanvas(canvas, canvasWidth, canvasRatio);
    });

  initKeydownEvent(document.getElementById('download-icon'));
};

const lazyLoadRenderCanvas = (opts = {}) => {
  const {
    thresholdElementsIds = ['reset-canvas', 'canvas'],
    complete = false,
  } = opts;
  const observer = new IntersectionObserver((entries, thisObserver) => {
    entries.some(async entry => {
      if (entry.isIntersecting) {
        const { renderCanvas } = await import('./render-canvas.js');
        renderCanvas(30);

        thresholdElementsIds.forEach(id => {
          thisObserver.unobserve(document.getElementById(id));
        });

        if (complete instanceof Function) complete();
        return true; // stops some() iteration
      }
    });
  });

  thresholdElementsIds.forEach(id =>
    observer.observe(document.getElementById(id))
  );
};

const start = () => {
  initToggleInstructionsHandler();
  initDownloadHandler();

  lazyLoadRenderCanvas({
    complete: () => {
      if (!isMobile()) {
        canvas.addEventListener('click', () => {
          Brush.state = Brush.isOn ? 'off' : 'on';
        });
      }
      initChangeColorHandler();
      [
        'erase-mode',
        'random-color-mode',
        'progressive-darkening-mode',
        'progressive-lighten-mode',
        'toggle-grid',
      ].forEach(mode => initColorModeHandler(mode));
    },
  });

  initResetCanvasHandlers();

  if (!isMobile()) {
    window.onresize = resizeCanvas;
  } else {
    Brush.state = 'on';
    screen.orientation.addEventListener('change', resizeCanvas);
  }
};

start();
