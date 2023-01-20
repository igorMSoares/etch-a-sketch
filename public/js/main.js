import isMobile from './is-mobile.js';

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
        const { renderCanvas } = await import('./canvas.js');
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

const start = async () => {
  const { default: initToggleInstructionsHandler } = await import(
    './toggle-instructions.js'
  );
  initToggleInstructionsHandler();

  addEventListener('load', async _ => {
    const { default: lazyDownloadCanvasHandler } = await import(
      './download-canvas.js'
    );
    lazyDownloadCanvasHandler();
  });

  lazyRenderCanvas({
    complete: async () => {
      const { Brush } = await import('./brush.js');
      const { resizeCanvas, initResetCanvasHandlers } = await import(
        './canvas.js'
      );
      if (!isMobile()) {
        document.getElementById('canvas').addEventListener('click', () => {
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

      initResetCanvasHandlers();
    },
  });
};

start();
