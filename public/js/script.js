import isMobile from './is-mobile.js';
import initKeydownEvent from './init-keydown.js';

const canvas = document.getElementById('canvas');
const root = document.querySelector(':root');

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
    await import('./html2canvas.min.js');

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

const lazyRenderCanvas = (opts = {}) => {
  const {
    totalColumns: TOTAL_COLUMNS = 30,
    loading: LOADING = {
      className: 'loading-canvas',
      message: 'Loading Canvas...',
      messageAreaId: 'color-picker',
    },
    observedElementId: OBSERVED_ELEMENT_ID = 'reset-canvas',
    complete = false,
  } = opts;

  const loadingMsg = (() => {
    /** Container must always be a <p>
     * If changed to different element, must be changed in renderCanvas() too */
    const p = document.createElement('p');
    p.classList.add(LOADING.className);
    p.innerHTML = LOADING.message;
    return p;
  })();

  const observer = new IntersectionObserver(async (entries, thisObserver) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        document.getElementById(LOADING.messageAreaId).appendChild(loadingMsg);
        const { renderCanvas } = await import('./render-canvas.js');
        renderCanvas(TOTAL_COLUMNS);
        const { initChangeColorHandler } = await import('./color-picker.js');
        initChangeColorHandler();

        thisObserver.unobserve(document.getElementById(OBSERVED_ELEMENT_ID));

        if (complete instanceof Function) complete();
      }
    }
  });

  observer.observe(document.getElementById(OBSERVED_ELEMENT_ID));
};

const start = () => {
  initToggleInstructionsHandler();
  initDownloadHandler();

  lazyRenderCanvas({
    complete: async () => {
      const { Brush } = await import('./brush.js');
      if (!isMobile()) {
        canvas.addEventListener('click', () => {
          Brush.state = Brush.isOn ? 'off' : 'on';
        });
        window.onresize = resizeCanvas;
      } else {
        Brush.state = 'on';
        screen.orientation.addEventListener('change', resizeCanvas);
      }

      const { initColorModeHandler } = await import('./color-modes.js');
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
};

start();
