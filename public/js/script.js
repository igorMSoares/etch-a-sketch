const canvas = document.getElementById('canvas');
const root = document.querySelector(':root');

const resizeSquares = squaresPerRow => {
  canvas.innerHTML = '';
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  console.log({ canvasHeight });
  let size = Math.round(canvasWidth / squaresPerRow) - 1;
  console.log({ size });
  root.style.setProperty('--square-size', `${size}px`);
  root.style.setProperty('--squares-per-row', `${squaresPerRow}`);

  let div;
  for (let i = 0; i < squaresPerRow * Math.floor(canvasHeight / size); i++) {
    div = document.createElement('div');
    div.classList.add('grid-unit');
    canvas.appendChild(div);
  }
};
resizeSquares(25);
