import isMobile from './is-mobile.js';

const initObserver = (observed_element_id, callback) => {
  const observer = new IntersectionObserver(async (entries, thisObserver) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (callback instanceof Function) callback();

        thisObserver.unobserve(document.getElementById(observed_element_id));
      }
    }
  });

  observer.observe(document.getElementById(observed_element_id));
};

const initCanvasObserver = (opts = {}) => {
  const {
    totalColumns = 30,
    loading = {
      className: 'loading-canvas',
      message: 'Loading Canvas...',
      messageAreaId: 'color-picker',
    },
    observedElementId = 'reset-canvas',
  } = opts;

  const loadingMsg = (() => {
    /** Container must always be a <p>
     * If changed to different element, must be changed in renderCanvas() too */
    const p = document.createElement('p');
    p.classList.add(loading.className);
    p.innerHTML = loading.message;
    return p;
  })();

  initObserver(observedElementId, async () => {
    document.getElementById(loading.messageAreaId).appendChild(loadingMsg);
    const { renderCanvas } = await import('./canvas.js');
    renderCanvas(totalColumns);

    const { initChangeColorHandler } = await import('./color-picker.js');
    initChangeColorHandler();

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
  });
};

const initDownloadCanvasObserver = (observedElementId = 'download') => {
  initObserver(observedElementId, async () => {
    const { default: initDownloadHandler } = await import(
      './download-canvas.js'
    );
    initDownloadHandler();
  });
};

const start = async () => {
  const { default: initToggleInstructionsHandler } = await import(
    './toggle-instructions.js'
  );
  initToggleInstructionsHandler();
  initCanvasObserver();
  initDownloadCanvasObserver();
};

start();
