import initKeydownEvent from './init-keydown.js';

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
            document.querySelector(':root').style.removeProperty('cursor');
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
          document.querySelector(':root').style.setProperty('cursor', 'wait');
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

const lazyDownloadCanvasHandler = (observed_element_id = 'download') => {
  const downloadCanvasObserver = new IntersectionObserver(
    (entries, thisObserver) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          initDownloadHandler();

          thisObserver.unobserve(document.getElementById(entry.target.id));
        }
      }
    }
  );
  downloadCanvasObserver.observe(document.getElementById(observed_element_id));
};

export default lazyDownloadCanvasHandler;
