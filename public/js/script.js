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
  addEventListener('load', async _ => {
    const { default: lazyDownloadCanvasHandler } = await import(
      './download-canvas.js'
    );
    lazyDownloadCanvasHandler();
  });
  initToggleInstructionsHandler();

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
